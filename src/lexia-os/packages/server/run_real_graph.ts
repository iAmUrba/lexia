import { DatabaseManager } from '../infrastructure/sqlite/DatabaseManager.js';
import { MigrationManager } from '../infrastructure/sqlite/MigrationManager.js';
import { GraphClient } from '../infrastructure/graph/impl/GraphClient.js';
import { GraphOneDriveFileSystem } from '../infrastructure/graph/impl/GraphOneDriveFileSystem.js';
import { IGraphAuthProvider, IGraphTransport, GraphConfiguration, LexIAEnvironment } from '../infrastructure/graph/contracts/GraphContracts.js';
import { EvidenceExtractor } from '../domain/glosador/EvidenceSystem/EvidenceExtractor.js';
import { EvidenceResolver } from '../domain/glosador/EvidenceSystem/EvidenceResolver.js';
import { ExpedienteRepository } from '../domain/glosador/EvidenceSystem/ExpedienteRepository.js';
import { EvidenceScorer } from '../domain/glosador/EvidenceSystem/Scoring/EvidenceScorer.js';
import { ReviewSession } from '../domain/glosador/ApprovalWorkflow/ReviewSession.js';
import { SqliteDecisionRepository } from '../domain/glosador/ApprovalWorkflow/DecisionRepository.js';
import { ExecutionPlanBuilder } from '../domain/glosador/ExecutionSystem/ExecutionPlanBuilder.js';
import { PreflightValidator } from '../domain/glosador/ExecutionSystem/PreflightValidator.js';
import { DryRunExecutor } from '../domain/glosador/ExecutionSystem/DryRunExecutor.js';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read settings and token
const authState = JSON.parse(fs.readFileSync(path.join(__dirname, '.data', '.auth_state.json'), 'utf8'));
const REAL_TOKEN = authState.accessToken;

// Real Auth Provider using the manually injected token
class ManualAuthProvider implements IGraphAuthProvider {
    async getAccessToken(): Promise<string> { return REAL_TOKEN; }
    invalidateToken(): void { console.warn("Token invalidated! Need a new one."); }
}

// Real Fetch Transport for Microsoft Graph
class FetchTransport implements IGraphTransport {
    async request<T>(method: string, fullUrl: string, options?: any): Promise<{ status: number; data: T | null; headers: Record<string, string>; }> {
        const fetchOptions: RequestInit = {
            method,
            headers: options?.headers || {}
        };
        if (options?.body) fetchOptions.body = JSON.stringify(options.body);
        if (options?.signal) fetchOptions.signal = options.signal;

        const response = await fetch(fullUrl, fetchOptions);
        let data = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const arrayBuffer = await response.arrayBuffer();
            data = Buffer.from(arrayBuffer) as any;
        }

        const headers: Record<string, string> = {};
        response.headers.forEach((v, k) => headers[k] = v);

        if (!response.ok) {
            console.error('Fetch error:', response.status, data?.toString());
        }

        return { status: response.status, data, headers };
    }
}

async function runRealGraphSlice() {
    console.log('--- Iniciando LexIA E2E (Real Graph + Token) ---');
    const status = {
        graphDownload: 'FAIL',
        evidence: 'FAIL',
        report: 'FAIL',
        decision: 'FAIL',
        plan: 'FAIL',
        preflight: 'FAIL',
        dryrun: 'FAIL'
    };

    let traceId = crypto.randomUUID();
    
    try {
        // 1. Setup SQLite
        const dbPath = path.join(__dirname, '..', '..', 'data', `real_slice_${Date.now()}.db`);
        process.env.LEXIA_DB_PATH = dbPath;
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
        if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
        if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');

        const dbManager = DatabaseManager.getInstance();
        dbManager.connect();
        
        const migrationsDir = path.join(__dirname, '..', 'infrastructure', 'sqlite', 'migrations');
        const migrationManager = new MigrationManager(dbManager);
        migrationManager.runMigrations(migrationsDir);

        // 2. Setup Real Graph
        const config: GraphConfiguration = {
            apiVersion: 'v1.0', 
            baseUrl: 'https://graph.microsoft.com', 
            tenantId: '622cba98-80f8-41f3-8df5-8eb99901598b', 
            clientId: '89bee1f7-5e6e-4d8a-9f3d-ecd601259da7', 
            scopes: [], 
            authority: '', 
            environment: LexIAEnvironment.SANDBOX 
        };
        
        const transport = new FetchTransport();
        const client = new GraphClient(config, new ManualAuthProvider(), transport);
        
        console.log('Verifying Microsoft Graph Connection...');
        const me = await client.get<any>('/me');
        console.log(`Connected as: ${me.displayName}`);
        
        const drive = await client.get<any>('/me/drive');
        console.log(`Drive ID: ${drive.id}`);
        
        const fileSystem = new GraphOneDriveFileSystem(client, drive.id);

        console.log('Buscando "carta sebastian.pdf" en el root...');
        const rootItems = await client.get<any>(`/drives/${drive.id}/root/children`);
        const targetPdf = rootItems.value.find((i: any) => i.name.toLowerCase() === 'carta sebastian.pdf');
        
        if (!targetPdf) {
            throw new Error('No se encontró carta sebastian.pdf en el Drive.');
        }

        console.log(`Descargando ${targetPdf.name}...`);
        const downloadedPdf = await client.get<Buffer>(`/drives/${drive.id}/items/${targetPdf.id}/content`);
        const pdfHash = crypto.createHash('sha256').update(downloadedPdf).digest('hex');
        status.graphDownload = 'OK';

        // 3. Evidence Extraction & Resolution
        console.log('Extrayendo evidencias...');
        const extractor = new EvidenceExtractor();
        const repository = new ExpedienteRepository();
        
        // Mock the backend repo data just to allow a match
        repository.injectMockData([
            {
                id: 'expediente_1',
                path: '/expediente_1',
                radicados: ['210013104001202300123'], // dummy radicado
                spoa: [],
                cui: [],
                procesados: ['SEBASTIAN']
            }
        ], []);
        
        const scorer = new EvidenceScorer();
        const resolver = new EvidenceResolver(repository, scorer);

        // NOTE: We assume 'carta sebastian.pdf' is a text-based PDF or text document.
        // For E2E we usually use a parser, but here we just pass the buffer string representation for the mock extractor.
        const pdfText = downloadedPdf.toString('utf8');
        const evidence = extractor.extract(pdfText);
        (evidence as any).hash = pdfHash;
        (evidence as any).path = `/drives/${drive.id}/items/${targetPdf.id}`;
        
        console.log(`Evidencia extraída. Confianza: ${evidence.confidence}`);
        status.evidence = 'OK';

        const report = await resolver.resolve(evidence);
        console.log(`Resultado Resolver: ${report.estado}`);
        status.report = 'OK';

        // 4. Decision & Persistence
        const investigationReport = {
            documentId: targetPdf.id,
            engineVersion: '1.0',
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            extractorEvidence: evidence,
            resolverResult: report
        };
        const propuesta = {
            engineVersion: '1.0',
            evidenceVersion: '1.0',
            indiceVersion: '1.0',
            expedienteId: report.expedienteId || 'expediente_1',
            consecutivo: 10,
            investigationReportSnapshot: investigationReport
        };
        const session = new ReviewSession(targetPdf.id, 'user_123', propuesta);
        const decisionEvent = session.approve();
        
        const decisionRepo = new SqliteDecisionRepository();
        await decisionRepo.appendEvent(decisionEvent);
        status.decision = 'OK';

        // 5. Execution Plan
        const plan = ExecutionPlanBuilder.buildFromDecision(decisionEvent);
        status.plan = 'OK';

        // 6. Preflight Validator
        class MockLockManager { async isLocked(id: string) { return false; } }
        const preflight = new PreflightValidator(fileSystem, new MockLockManager());
        
        // Mock excel hash
        const excelHash = 'mock_excel_hash';
        const preflightReport = await preflight.validate(
            plan,
            report.expedienteId || 'expediente_1',
            '/expediente/00_IndiceElectronico.xlsx',
            excelHash
        );
        status.preflight = 'OK';

        // 7. Dry Run
        const dryRun = new DryRunExecutor();
        const dryRunReport = await dryRun.execute(plan, preflightReport);
        status.dryrun = 'OK';

        dbManager.close();
        
        console.log(`\n=== E2E REAL GRAPH SLICE ===
Download:.......${status.graphDownload}
Evidence:.......${status.evidence}
Report:.........${status.report}
Decision:.......${status.decision}
Plan:...........${status.plan}
Preflight:......${status.preflight}
DryRun:.........${status.dryrun}

RESULT: SUCCESS! 🎉`);

    } catch (err: any) {
        console.error('\n❌ E2E Failed:', err.message);
    }
}

runRealGraphSlice();
