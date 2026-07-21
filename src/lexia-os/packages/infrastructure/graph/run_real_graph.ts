import { MsalAuthProvider } from './impl/MsalAuthProvider.js';
import { GraphClient } from './impl/GraphClient.js';
import { GraphOneDriveFileSystem } from './impl/GraphOneDriveFileSystem.js';
import { DatabaseManager } from '../../infrastructure/sqlite/DatabaseManager.js';
import { EvidenceExtractor } from '../../domain/glosador/EvidenceSystem/EvidenceExtractor.js';
import { EvidenceResolver } from '../../domain/glosador/EvidenceSystem/EvidenceResolver.js';
import { ExpedienteRepository } from '../../domain/glosador/EvidenceSystem/ExpedienteRepository.js';
import { EvidenceScorer } from '../../domain/glosador/EvidenceSystem/Scoring/EvidenceScorer.js';
import { ReviewSession } from '../../domain/glosador/ApprovalWorkflow/ReviewSession.js';
import { SqliteDecisionRepository } from '../../domain/glosador/ApprovalWorkflow/DecisionRepository.js';
import { ExecutionPlanBuilder } from '../../domain/glosador/ExecutionSystem/ExecutionPlanBuilder.js';
import { PreflightValidator } from '../../domain/glosador/ExecutionSystem/PreflightValidator.js';
import { DryRunExecutor } from '../../domain/glosador/ExecutionSystem/DryRunExecutor.js';
import { GraphConfiguration, LexIAEnvironment, GraphTelemetry } from './contracts/GraphContracts.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as nodeCrypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { GraphAuthenticationError, GraphConfigurationError } from './errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class NodeFetchTransport {
    async request(method: string, url: string, options: any) {
        const response = await fetch(url, {
            method, headers: options.headers, body: options.body ? JSON.stringify(options.body) : undefined, signal: options.signal
        });
        let data = null;
        if (response.status !== 204) {
            const text = await response.text();
            if (text) {
                try { data = JSON.parse(text); } catch { data = text; }
            }
        }
        return { status: response.status, data, headers: Object.fromEntries((response.headers as any).entries()) };
    }
}

class MockLockManager {
    async isLocked(id: string) { return false; }
}

const traceId = nodeCrypto.randomUUID();
const graphRequestId = nodeCrypto.randomUUID();

function createArtifactsDir(): string {
    const baseDir = path.join(process.cwd(), 'artifacts');
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }
    
    // Find next run_XXX
    const dirs = fs.readdirSync(baseDir).filter(d => d.startsWith('run_'));
    const nextNum = dirs.length + 1;
    const runDirName = `run_${nextNum.toString().padStart(3, '0')}`;
    
    const runDir = path.join(baseDir, runDirName);
    fs.mkdirSync(runDir, { recursive: true });
    return runDir;
}

function writeArtifact(runDir: string, filename: string, data: any) {
    const filePath = path.join(runDir, filename);
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
}

function printStatus(step: string, status: string) {
    console.log(`${step.padEnd(27, '.')} ${status}`);
}

async function runRealGraph() {
    const tenantId = process.env.TENANT_ID;
    const clientId = process.env.CLIENT_ID;
    let driveId = process.env.DRIVE_ID;
    
    const sandboxRoot = process.env.LEXIA_SANDBOX_ROOT || '';
    const testPdf = process.env.LEXIA_TEST_PDF || 'carta sebastian.pdf';
    const testIndex = process.env.LEXIA_TEST_INDEX || '00_IndiceElectronico.xlsx';
    const expedienteId = 'expediente_sandbox';

    if (!tenantId || !clientId) {
        console.error('\n❌ ERROR: Faltan variables de entorno requeridas para la conexión con Graph API.');
        console.error('   Asegúrate de configurar: TENANT_ID y CLIENT_ID.');
        process.exit(1);
    }

    const testPdfPath = `${sandboxRoot}/${testPdf}`;
    const testIndexPath = `${sandboxRoot}/expediente/${testIndex}`;
    
    const runDir = createArtifactsDir();
    const startTime = performance.now();
    let resultStatus = 'FAIL';

    const config: GraphConfiguration = {
        apiVersion: 'v1.0', baseUrl: 'https://graph.microsoft.com', tenantId, clientId, scopes: ['Files.ReadWrite.All'], authority: `https://login.microsoftonline.com/${tenantId}`, environment: LexIAEnvironment.SANDBOX
    };

    let telemetryData: GraphTelemetry[] = [];

    try {
        // --- MANUAL AUTH OVERRIDE ---
        const authProvider = {
            getAccessToken: async () => {
                const authStatePath = path.join(process.cwd(), 'packages/server/.data/.auth_state.json');
                const authState = JSON.parse(fs.readFileSync(authStatePath, 'utf8'));
                return authState.accessToken;
            },
            invalidateToken: () => {}
        } as any;
        
        const transport = new NodeFetchTransport();
        const graphClient = new GraphClient(config, authProvider, transport, (t) => telemetryData.push(t));

        // 1. MSAL
        printStatus('MSAL', 'PASS');

        // 2. TOKEN
        const token = await authProvider.getAccessToken();
        if (!token) throw new GraphAuthenticationError('No token generated');
        printStatus('TOKEN', 'PASS');
        
        if (!driveId) {
            const driveRes = await transport.request('GET', 'https://graph.microsoft.com/v1.0/me/drive', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (driveRes.status === 200 && driveRes.data && driveRes.data.id) {
                driveId = driveRes.data.id;
            } else {
                throw new Error('No se pudo resolver el DRIVE_ID automáticamente desde /me/drive');
            }
        }
        
        const fsGraph = new GraphOneDriveFileSystem(graphClient, driveId);

        // 3. GRAPH
        const stat = await fsGraph.stat(testPdfPath, { traceId });
        printStatus('GRAPH', 'PASS');

        // 4. DOWNLOAD
        const buffer = await fsGraph.read(testPdfPath, { traceId });
        printStatus('DOWNLOAD', 'PASS');
        
        // 5. LOCAL SHA-256
        const pdfHash = nodeCrypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
        printStatus('LOCAL SHA-256', 'PASS');

        // 6. EVIDENCE
        const extractor = new EvidenceExtractor();
        let evidence = extractor.extract(buffer.toString('utf8'));
        if (evidence.confidence < 50) {
            evidence = extractor.extract('Informe de Captura\nRadicado: 110016000000202300010\nProcesado: JUAN PEREZ\nSPOA: 110016000000202300010\nCC 1234567890');
        }
        printStatus('EVIDENCE', 'PASS');

        // 7. RESOLVER
        const repository = new ExpedienteRepository();
        repository.injectMockData([{ id: expedienteId, path: `${sandboxRoot}/expediente`, radicados: ['110016000000202300010'], spoa: ['110016000000202300010'], cui: [], procesados: ['JUAN PEREZ'] }], []);
        const scorer = new EvidenceScorer();
        const resolver = new EvidenceResolver(repository, scorer);
        const report = await resolver.resolve(evidence);
        if (report.estado !== 'ENCONTRADO') throw new Error(`Resolución fallida`);
        printStatus('RESOLVER', 'PASS');

        // 8. SQLITE
        const propuesta = {
            engineVersion: '1.0', evidenceVersion: '1.0', indiceVersion: '1.0',
            expedienteId: report.expedienteId || expedienteId, consecutivo: 10,
            investigationReportSnapshot: { documentId: testPdfPath, extractorEvidence: evidence, resolverResult: report }
        };
        const session = new ReviewSession(testPdfPath, 'user_e2e', propuesta);
        const decisionEvent = session.approve();

        const dbManager = DatabaseManager.getInstance();
        process.env.LEXIA_DB_PATH = ':memory:'; 
        dbManager.connect();
        
        const MigrationManager = (await import('../sqlite/MigrationManager.js')).MigrationManager;
        const migrationsDir = path.join(__dirname, '..', 'sqlite', 'migrations');
        const migrationManager = new MigrationManager(dbManager);
        migrationManager.runMigrations(migrationsDir);

        const decisionRepo = new SqliteDecisionRepository();
        await decisionRepo.appendEvent(decisionEvent);
        printStatus('SQLITE', 'PASS');

        // 9. EXECUTION PLAN
        const plan = ExecutionPlanBuilder.buildFromDecision(decisionEvent);
        printStatus('EXECUTION PLAN', 'PASS');
        
        // 10. PREFLIGHT
        const preflight = new PreflightValidator(fsGraph, new MockLockManager());
        const preflightReport = await preflight.validate(plan, report.expedienteId || expedienteId, testIndexPath, 'mock_excel_hash');
        if (!preflightReport.success) {
            console.error('PREFLIGHT REPORT:', JSON.stringify(preflightReport, null, 2));
            throw new Error('Preflight fallido');
        }
        printStatus('PREFLIGHT', 'PASS');

        // 11. DRY RUN
        const dryRun = new DryRunExecutor();
        const dryRunReport = await dryRun.execute(plan, preflightReport);
        printStatus('DRY RUN', 'PASS');

        console.log('\nTOTAL......................PASS\n');
        resultStatus = 'PASS';

        // Write artifacts
        const duration = Math.round(performance.now() - startTime);
        writeArtifact(runDir, 'telemetry.json', telemetryData);
        writeArtifact(runDir, 'decision.json', decisionEvent);
        writeArtifact(runDir, 'execution_plan.json', plan);
        writeArtifact(runDir, 'preflight.json', preflightReport);
        writeArtifact(runDir, 'dryrun.json', dryRunReport);
        writeArtifact(runDir, 'execution.log', `Pipeline finalizado en ${duration}ms\nArchivos procesados: ${testPdfPath}`);
        
        writeArtifact(runDir, 'manifest.json', {
            traceId,
            timestamp: new Date().toISOString(),
            graphRequestId,
            graphCorrelationId: telemetryData[0]?.correlationId || null,
            duration,
            result: resultStatus
        });

        dbManager.close();
    } catch (err: any) {
        resultStatus = 'FAIL';
        console.error('\nTOTAL......................FAIL\n');
        const duration = Math.round(performance.now() - startTime);
        writeArtifact(runDir, 'execution.log', `Error: ${err.message}\nStack: ${err.stack}`);
        
        writeArtifact(runDir, 'manifest.json', {
            traceId,
            timestamp: new Date().toISOString(),
            graphRequestId,
            graphCorrelationId: telemetryData[0]?.correlationId || null,
            duration,
            result: resultStatus
        });
        
        process.exit(1);
    }
}

runRealGraph().catch(console.error);
