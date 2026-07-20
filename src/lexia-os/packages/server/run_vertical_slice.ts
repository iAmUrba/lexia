import { DatabaseManager } from '../infrastructure/sqlite/DatabaseManager.js';
import { MigrationManager } from '../infrastructure/sqlite/MigrationManager.js';
import { GraphClient } from '../infrastructure/graph/impl/GraphClient.js';
import { GraphOneDriveFileSystem } from '../infrastructure/graph/impl/GraphOneDriveFileSystem.js';
import { IGraphAuthProvider, IGraphTransport, GraphConfiguration, LexIAEnvironment, GraphApiError } from '../infrastructure/graph/contracts/GraphContracts.js';
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

// Mock Auth & Transport (Sandbox)
class MockAuthProvider implements IGraphAuthProvider {
    async getAccessToken(): Promise<string> { return 'sandbox_token'; }
    invalidateToken(): void {}
}

class MockTransport implements IGraphTransport {
    public store: Map<string, any> = new Map();

    async request<T>(method: string, fullUrl: string, options?: any): Promise<{ status: number; data: T | null; headers: Record<string, string>; }> {
        const urlObj = new URL(fullUrl);
        const path = decodeURIComponent(urlObj.pathname.replace('/v1.0', ''));

        if (method === 'GET') {
            if (path.endsWith('content')) {
                let itemPath = path.replace('content', '');
                if (itemPath.endsWith(':/')) itemPath = itemPath.slice(0, -2);
                if (!this.store.has(itemPath)) throw new GraphApiError(404, 'Not found', false);
                return { status: 200, data: this.store.get(itemPath).content as T, headers: {} };
            }
            let itemPath = path;
            if (itemPath.endsWith(':/')) itemPath = itemPath.slice(0, -2);
            if (!this.store.has(itemPath)) throw new GraphApiError(404, 'Not found', false);
            return { status: 200, data: this.store.get(itemPath) as T, headers: {} };
        }
        throw new Error(`Method ${method} not mocked for ${path}`);
    }
}

async function runVerticalSlice() {
    console.log('--- Iniciando LexIA Vertical Slice ---');
    const status = {
        pdf: 'FAIL',
        evidence: 'FAIL',
        report: 'FAIL',
        decision: 'FAIL',
        sqlite: 'FAIL',
        plan: 'FAIL',
        preflight: 'FAIL',
        dryrun: 'FAIL'
    };

    let traceId = crypto.randomUUID();
    let decisionId = '';
    let planHash = '';
    
    try {
        // 1. Setup SQLite
        const dbPath = path.join(__dirname, '..', '..', 'data', `vertical_slice_${Date.now()}.db`);
        process.env.LEXIA_DB_PATH = dbPath;
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); // Clean start for vertical slice
        if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
        if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');

        const dbManager = DatabaseManager.getInstance();
        dbManager.connect();
        
        const migrationsDir = path.join(__dirname, '..', 'infrastructure', 'sqlite', 'migrations');
        const migrationManager = new MigrationManager(dbManager);
        migrationManager.runMigrations(migrationsDir);

        // 2. Setup Graph Mock
        const config: GraphConfiguration = {
            apiVersion: 'v1.0', baseUrl: 'https://graph.microsoft.com', tenantId: 't', clientId: 'c', scopes: [], authority: 'a', environment: LexIAEnvironment.SANDBOX
        };
        const transport = new MockTransport();
        const client = new GraphClient(config, new MockAuthProvider(), transport);
        const fileSystem = new GraphOneDriveFileSystem(client, 'sandbox_drive');

        // Seed data: Evidence PDF and Index Excel
        // We use a mock text that contains a valid 21 digit SPOA and a radicado to get high confidence
        const pdfContent = Buffer.from('Informe de Captura\nRadicado: 110016000000202300010\nProcesado: JUAN PEREZ\nSPOA: 110016000000202300010\nTipo: CAPTURA\nCC 1234567890');
        const pdfHash = crypto.createHash('sha256').update(pdfContent).digest('hex');
        transport.store.set('/drives/sandbox_drive/root:/expediente/doc1.pdf', { size: pdfContent.length, lastModifiedDateTime: new Date().toISOString(), content: pdfContent });
        status.pdf = 'OK';

        const excelContent = Buffer.from('Indice Excel content');
        const excelHash = crypto.createHash('sha256').update(excelContent).digest('hex');
        transport.store.set('/drives/sandbox_drive/root:/expediente/00_IndiceElectronico.xlsx', { size: excelContent.length, lastModifiedDateTime: new Date().toISOString(), content: excelContent });

        // 3. Evidence Extraction & Resolution
        // Read file content from Graph FS to simulate downloading
        const downloadedPdf = await fileSystem.read('/expediente/doc1.pdf');
        
        const extractor = new EvidenceExtractor();
        
        const repository = new ExpedienteRepository();
        repository.injectMockData([
            {
                id: 'expediente',
                path: '/expediente',
                radicados: ['110016000000202300010'],
                spoa: ['110016000000202300010'],
                cui: [],
                procesados: ['JUAN PEREZ']
            }
        ], []);
        const scorer = new EvidenceScorer();
        const resolver = new EvidenceResolver(repository, scorer);

        // Extraemos texto directamente del buffer descargado
        const evidence = extractor.extract(downloadedPdf.toString('utf8'));
        // In E2E we usually calculate the hash of the file too, so let's attach the hash
        (evidence as any).hash = pdfHash;
        (evidence as any).path = '/expediente/doc1.pdf';
        
        // Ensure confidence is high enough for the Resolver to act
        if (evidence.confidence < 50) throw new Error('Evidence confidence too low: ' + evidence.confidence);
        status.evidence = 'OK';

        const report = await resolver.resolve(evidence);
        if (report.estado !== 'ENCONTRADO') throw new Error('Resolver failed: ' + report.estado);
        status.report = 'OK';

        // 4. simulated Human Approval
        const investigationReport = {
            documentId: '/expediente/doc1.pdf',
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
            expedienteId: report.expedienteId || 'expediente',
            consecutivo: 5,
            investigationReportSnapshot: investigationReport
        };
        const session = new ReviewSession('/expediente/doc1.pdf', 'user_123', propuesta);
        const decisionEvent = session.approve();

        decisionId = decisionEvent.eventId;
        status.decision = 'OK';

        // 5. SQLite Persistence
        const decisionRepo = new SqliteDecisionRepository();
        await decisionRepo.appendEvent(decisionEvent);
        const recoveredEvents = await decisionRepo.getEvents(decisionEvent.documentId);
        if (recoveredEvents.length === 0 || recoveredEvents[0].hash !== decisionEvent.hash) throw new Error('Failed to persist or recover from SQLite');
        status.sqlite = 'OK';

        // 6. Execution Plan
        const plan = ExecutionPlanBuilder.buildFromDecision(decisionEvent);
        planHash = plan.planHash;
        status.plan = 'OK';

        // 7. Preflight Validator
        class MockLockManager {
            async isLocked(id: string) { return false; }
        }
        const preflight = new PreflightValidator(fileSystem, new MockLockManager());
        
        const preflightReport = await preflight.validate(
            plan,
            report.expedienteId || 'expediente',
            '/expediente/00_IndiceElectronico.xlsx',
            excelHash
        );
        if (!preflightReport.success) throw new Error('Preflight failed: ' + JSON.stringify(preflightReport.validations));
        status.preflight = 'OK';

        // 8. Dry Run
        const dryRun = new DryRunExecutor();
        const dryRunReport = await dryRun.execute(plan, preflightReport);
        if (!dryRunReport.ready || dryRunReport.operations.some(o => o.status !== 'READY')) {
            throw new Error('Dry Run failed or not fully READY');
        }
        status.dryrun = 'OK';

        dbManager.close();

    } catch (err: any) {
        console.error('\n❌ Vertical Slice Failed:', err.message);
    }

    console.log(`\n=== LEXIA VERTICAL SLICE ===

PDF.....................${status.pdf}
Evidence...............${status.evidence}
InvestigationReport....${status.report}
DecisionEvent..........${status.decision}
SQLite Persist.........${status.sqlite}
ExecutionPlan..........${status.plan}
Preflight..............${status.preflight}
DryRun.................${status.dryrun}

TRACE_ID: ${traceId}
DECISION_ID: ${decisionId || 'N/A'}
PLAN_HASH: ${planHash || 'N/A'}

RESULT: ${Object.values(status).every(v => v === 'OK') ? 'SUCCESS' : 'FAILED'}`);
    
    if (Object.values(status).some(v => v !== 'OK')) {
        process.exit(1);
    }
}

runVerticalSlice();
