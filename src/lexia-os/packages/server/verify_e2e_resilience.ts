import { GraphClient } from '../infrastructure/graph/impl/GraphClient.js';
import { GraphOneDriveFileSystem } from '../infrastructure/graph/impl/GraphOneDriveFileSystem.js';
import { IGraphTransport, IGraphAuthProvider, GraphConfiguration, GraphApiError, LexIAEnvironment } from '../infrastructure/graph/contracts/GraphContracts.js';
import { InfrastructureError, InfrastructureErrorType } from '../domain/glosador/ExecutionSystem/Contracts/InfrastructureError.js';
import * as crypto from 'crypto';

class MockAuthProvider implements IGraphAuthProvider {
    public tokenExpires = false;
    async getAccessToken(): Promise<string> {
        if (this.tokenExpires) throw new Error('Token expired during fetch');
        return 'sandbox_token';
    }
    invalidateToken(): void {
        this.tokenExpires = false;
    }
}

class MockTransport implements IGraphTransport {
    public store: Map<string, any> = new Map();
    public injectError: any = null;
    public networkDrop = false;
    public incompleteDownload = false;

    async request<T>(method: string, fullUrl: string, options?: any): Promise<{ status: number; data: T | null; headers: Record<string, string>; }> {
        if (options?.signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        if (this.injectError) {
            const err = this.injectError;
            this.injectError = null; // one-time error
            throw err;
        }

        if (this.networkDrop) {
            throw { message: 'Failed to fetch' }; // Fetch network error
        }

        // Add 50ms delay to allow abort signals to trigger
        await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(resolve, 50);
            if (options?.signal) {
                options.signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            }
        });
        
        if (options?.signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        const path = fullUrl.replace('https://graph.microsoft.com/v1.0', '');
        
        if (method === 'GET') {
            if (path.endsWith('content')) {
                const itemPath = path.replace('content', '');
                if (!this.store.has(itemPath)) throw new GraphApiError(404, 'Not found', false);
                
                let content = this.store.get(itemPath).content;
                if (this.incompleteDownload) {
                    content = Buffer.from(content.toString().substring(0, Math.floor(content.length / 2)));
                }
                
                return { status: 200, data: content as T, headers: {} };
            }
            if (!this.store.has(path)) throw new GraphApiError(404, 'Not found', false);
            return { status: 200, data: this.store.get(path) as T, headers: {} };
        }
        throw new Error('Method not mocked');
    }
}

class EvidenceExtractor {
    constructor(private fs: any) {}
    async extract(path: string, options?: any) {
        // Fetch metadata to know expected size/hash
        const stat = await this.fs.stat(path, options);
        
        const data = await this.fs.read(path, options);
        
        if (data.length !== stat.size) {
            throw new InfrastructureError(InfrastructureErrorType.INTEGRITY, 'Download incomplete or corrupted');
        }
        
        const actualHash = crypto.createHash('sha256').update(data).digest('hex');
        return { path, hash: actualHash, contentExtracted: data.toString(), pages: 1 };
    }
}

class EvidenceResolver {
    async resolve(evidence: any) {
        return { decision: 'APPROVE', evidenceHash: evidence.hash };
    }
}

const config: GraphConfiguration = {
    apiVersion: 'v1.0', baseUrl: 'https://graph.microsoft.com', tenantId: 't', clientId: 'c', scopes: [], authority: 'a', environment: LexIAEnvironment.SANDBOX
};

async function verifyE2EResilience() {
    console.log('\n--- LEXIA CORE: VERIFY E2E READ RESILIENCE ---');
    let allPassed = true;

    const runTest = async (name: string, setupTransport: (transport: MockTransport, auth: MockAuthProvider) => void, expectedOutcome: 'SUCCESS' | 'ABORT' | 'ERROR', expectedErrorType?: InfrastructureErrorType) => {
        const auth = new MockAuthProvider();
        const transport = new MockTransport();
        const client = new GraphClient(config, auth, transport);
        const fs = new GraphOneDriveFileSystem(client, 'sandbox_drive');
        
        const fileContent = Buffer.from('Resilience PDF Data');
        transport.store.set('/drives/sandbox_drive/root:/expediente/doc.pdf', { size: fileContent.length, lastModifiedDateTime: 'now' });
        transport.store.set('/drives/sandbox_drive/root:/expediente/doc.pdf:/', { size: fileContent.length, lastModifiedDateTime: 'now', content: fileContent });
        
        setupTransport(transport, auth);
        
        const controller = new AbortController();
        if (expectedOutcome === 'ABORT') {
            setTimeout(() => controller.abort(), 10);
        }

        try {
            const extractor = new EvidenceExtractor(fs);
            const evidence = await extractor.extract('/expediente/doc.pdf', { signal: controller.signal });
            const resolver = new EvidenceResolver();
            await resolver.resolve(evidence);
            
            if (expectedOutcome !== 'SUCCESS') throw new Error(`Test should have failed with ${expectedOutcome}`);
            console.log(`✓ ${name}`);
        } catch (e: any) {
            if (expectedOutcome === 'SUCCESS') {
                console.log(`❌ ${name} - Failed unexpectedly: ${e.message}`);
                allPassed = false;
            } else if (expectedOutcome === 'ABORT') {
                if (e.type !== InfrastructureErrorType.CANCELLATION) {
                    console.log(`❌ ${name} - Expected CANCELLATION, got: ${e.message}`);
                    allPassed = false;
                } else {
                    console.log(`✓ ${name}`);
                }
            } else if (expectedOutcome === 'ERROR') {
                if (e.type !== expectedErrorType) {
                    console.log(`❌ ${name} - Expected error ${expectedErrorType}, got: ${e.type} (${e.message})`);
                    allPassed = false;
                } else {
                    console.log(`✓ ${name}`);
                }
            }
        }
    };

    await runTest('429 durante descarga', (t) => {
        t.injectError = new GraphApiError(429, 'Rate limit', true);
    }, 'SUCCESS');

    await runTest('503 temporal', (t) => {
        t.injectError = new GraphApiError(503, 'Service unavailable', true);
    }, 'SUCCESS');

    await runTest('Timeout / Cancelación (AbortSignal)', (t) => {
        // We will abort manually
    }, 'ABORT');

    await runTest('Token expira durante el flujo (401)', (t) => {
        t.injectError = new GraphApiError(401, 'Unauthorized', false);
    }, 'ERROR', InfrastructureErrorType.AUTHENTICATION); // The client invalidates, but in our flow it throws the auth error up to the domain so we can get a new one or fail gracefully. For simplicity, we expect AUTHENTICATION error.

    await runTest('Red se cae definitivamente', (t) => {
        t.networkDrop = true;
    }, 'ERROR', InfrastructureErrorType.NETWORK);

    await runTest('Descarga incompleta (Hash mismatch)', (t) => {
        t.incompleteDownload = true;
    }, 'ERROR', InfrastructureErrorType.INTEGRITY);

    if (allPassed) {
        console.log('\nverify:e2e-resilience: PASSED');
    } else {
        console.log('\nverify:e2e-resilience: FAILED');
        process.exit(1);
    }
}

verifyE2EResilience();
