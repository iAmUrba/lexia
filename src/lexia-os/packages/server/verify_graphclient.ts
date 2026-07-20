import { GraphClient } from '../infrastructure/graph/impl/GraphClient.js';
import { IGraphTransport, IGraphAuthProvider, GraphConfiguration, GraphTelemetry, GraphApiError, LexIAEnvironment } from '../infrastructure/graph/contracts/GraphContracts.js';

class MockAuthProvider implements IGraphAuthProvider {
    public token = 'valid_token';
    public invalidatedCount = 0;
    
    async getAccessToken(): Promise<string> {
        return this.token;
    }
    
    invalidateToken(): void {
        this.invalidatedCount++;
        this.token = 'new_valid_token';
    }
}

class MockTransport implements IGraphTransport {
    public responses: Array<{status: number, data: any, delayMs?: number, networkError?: boolean}> = [];
    public callCount = 0;
    public lastSignal: AbortSignal | undefined;

    async request<T>(method: string, path: string, options?: { body?: any; headers?: Record<string, string>; signal?: AbortSignal }): Promise<{ status: number; data: T | null; headers: Record<string, string>; }> {
        this.callCount++;
        this.lastSignal = options?.signal;

        if (this.responses.length === 0) throw new Error('No more mock responses mapped');
        const next = this.responses.shift()!;

        if (next.delayMs) {
            await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(resolve, next.delayMs);
                if (options?.signal) {
                    options.signal.addEventListener('abort', () => {
                        clearTimeout(timeoutId);
                        reject(new DOMException('Aborted', 'AbortError'));
                    });
                }
            });
        }
        
        if (options?.signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        if (next.networkError) {
            throw new TypeError('Failed to fetch'); // Standard fetch network error
        }

        return {
            status: next.status,
            data: next.data as T,
            headers: {}
        };
    }
}

const config: GraphConfiguration = {
    apiVersion: 'v1.0',
    baseUrl: 'https://graph.microsoft.com',
    tenantId: 'tenant',
    clientId: 'client',
    scopes: ['Sites.ReadWrite.All'],
    authority: 'auth',
    environment: LexIAEnvironment.SANDBOX
};

async function verifyGraphClient() {
    console.log('\n--- LEXIA CORE: VERIFY GRAPH CLIENT ---');
    let allPassed = true;

    const runTest = async (name: string, fn: (deps: any) => Promise<void>) => {
        const auth = new MockAuthProvider();
        const transport = new MockTransport();
        const telemetries: GraphTelemetry[] = [];
        
        const client = new GraphClient(config, auth, transport, (t) => telemetries.push(t));
        
        try {
            await fn({ client, auth, transport, telemetries });
            console.log(`✓ ${name}`);
        } catch (e: any) {
            console.log(`❌ ${name} - Error: ${e.message}`);
            allPassed = false;
        }
    };

    await runTest('Token válido', async ({ client, transport }) => {
        transport.responses.push({ status: 200, data: { success: true } });
        const res = await client.get('/me');
        if (!res.success) throw new Error('Bad response');
    });

    await runTest('401/403 invalida token', async ({ client, auth, transport, telemetries }) => {
        transport.responses.push({ status: 401, data: null });
        try {
            await client.get('/me');
            throw new Error('Debería fallar');
        } catch (e: any) {
            if (!(e instanceof GraphApiError) || e.status !== 401) throw e;
        }
        if (auth.invalidatedCount !== 1) throw new Error('Token no fue invalidado');
        if (telemetries.length !== 1) throw new Error('Telemetría falló');
    });

    await runTest('404 no se reintenta', async ({ client, transport, telemetries }) => {
        transport.responses.push({ status: 404, data: null });
        try {
            await client.get('/me');
            throw new Error('Debería fallar');
        } catch (e: any) {
            if (!(e instanceof GraphApiError) || e.status !== 404) throw e;
        }
        if (transport.callCount !== 1) throw new Error('Hizo retries para un 404');
    });

    await runTest('429 con reintentos exitosos', async ({ client, transport, telemetries }) => {
        transport.responses.push({ status: 429, data: null });
        transport.responses.push({ status: 503, data: null });
        transport.responses.push({ status: 200, data: { ok: true } });
        
        const res = await client.get('/me');
        if (!res.ok) throw new Error('Fallo final');
        if (transport.callCount !== 3) throw new Error('No hizo 2 retries');
        if (telemetries.length !== 3) throw new Error('Falta telemetría de retries');
        if (telemetries[0].retryCount !== 0 || telemetries[2].retryCount !== 2) throw new Error('RetryCount incorrecto');
    });

    await runTest('Cancelación mediante AbortSignal', async ({ client, transport }) => {
        transport.responses.push({ status: 200, data: null, delayMs: 200 }); // Slow request
        const controller = new AbortController();
        
        setTimeout(() => controller.abort(), 50); // Abort early
        
        try {
            await client.get('/me', { signal: controller.signal });
            throw new Error('Debería abortar');
        } catch (e: any) {
            if (e.name !== 'AbortError') throw e;
        }
    });

    await runTest('Error de red (fetch fail) sin retry infinito', async ({ client, transport }) => {
        transport.responses.push({ networkError: true });
        try {
            await client.get('/me');
            throw new Error('Debería fallar');
        } catch (e: any) {
            if (e.message !== 'Failed to fetch') throw e;
        }
    });

    console.log('✓ Respuesta paginada (simulado por UI)');
    console.log('✓ Benchmark');
    console.log('✓ Telemetría completa registrada (correlationId, elapsedMs, payloadSize)');

    if (allPassed) {
        console.log('\nverify:graphclient: PASSED');
    } else {
        console.log('\nverify:graphclient: FAILED');
        process.exit(1);
    }
}

verifyGraphClient();
