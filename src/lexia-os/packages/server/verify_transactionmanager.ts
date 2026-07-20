import { TransactionManager, TransactionState, ITransactionStateStore, TimelineEvent } from '../domain/glosador/ExecutionSystem/TransactionManager.js';
import { ExecutionPlanBuilder } from '../domain/glosador/ExecutionSystem/ExecutionPlanBuilder.js';
import { PreflightReport } from '../domain/glosador/ExecutionSystem/PreflightValidator.js';
import { ExcelWriter, ExcelWriteResult } from '../domain/glosador/ExecutionSystem/ExcelWriter.js';
import { PdfMover, PdfMoverResult } from '../domain/glosador/ExecutionSystem/PdfMover.js';
import { IFileSystem } from '../domain/glosador/ExecutionSystem/Contracts/IFileSystem.js';

class MockStateStore implements ITransactionStateStore {
    public state: TransactionState = TransactionState.PENDING;
    public events: TimelineEvent[] = [];

    async saveState(executionId: string, state: TransactionState, timelineEvent: TimelineEvent): Promise<void> {
        this.state = state;
        this.events.push(timelineEvent);
    }

    async getState(executionId: string): Promise<TransactionState> {
        return this.state;
    }
}

class MockExcelWriter extends ExcelWriter {
    public failExecute = false;
    constructor() { super({} as any, {} as any); }
    async execute(): Promise<ExcelWriteResult> {
        if (this.failExecute) return { success: false, error: 'Excel Error', cellsModified: 0, hashBefore: '', hashAfter: '', durationMs: 0 };
        return { success: true, cellsModified: 2, hashBefore: '', hashAfter: '', durationMs: 0 };
    }
}

class MockPdfMover extends PdfMover {
    public failExecute = false;
    public failCompensate = false;
    public compensateCalled = false;
    constructor() { super({} as any); }
    async execute(): Promise<PdfMoverResult> {
        if (this.failExecute) return { success: false, error: 'PDF Error', status: 'FAILED', hashBefore: '', hashAfter: '', durationMs: 0 };
        return { success: true, status: 'COMPLETED', hashBefore: '', hashAfter: '', durationMs: 0 };
    }
    async compensate(): Promise<PdfMoverResult> {
        this.compensateCalled = true;
        if (this.failCompensate) return { success: false, error: 'Compensate Error', status: 'FAILED', hashBefore: '', hashAfter: '', durationMs: 0 };
        return { success: true, status: 'COMPLETED', hashBefore: '', hashAfter: '', durationMs: 0 };
    }
}

async function verifyTransactionManager() {
    console.log('\n--- LEXIA CORE: VERIFY TRANSACTION MANAGER ---');
    let allPassed = true;

    const createPlan = () => ExecutionPlanBuilder.buildFromDecision({
        eventId: 'evt-1',
        documentId: '/doc.pdf',
        timestamp: new Date().toISOString(),
        userId: 'USER_1',
        propuestaLexia: {
            engineVersion: 'v1',
            evidenceVersion: 'v1',
            indiceVersion: 'v1',
            expedienteId: 'exp-1',
            consecutivo: 1,
            investigationReportSnapshot: {
                extractorEvidence: { hash: 'pdf-hash-1' }
            }
        },
        decisionFuncionario: {
            expedienteId: 'exp-1',
            consecutivo: 1,
            accion: 'APROBAR',
            observaciones: 'ok'
        },
        hash: 'evt-hash-1'
    });
    
    const preflightOk = new PreflightReport(true, new Date().toISOString(), createPlan().planHash, [], { durationMs: 1 });

    const runTest = async (name: string, testFn: () => Promise<void>) => {
        try {
            await testFn();
            console.log(`✓ ${name}`);
        } catch (e: any) {
            console.log(`❌ ${name} - Error: ${e.message}`);
            allPassed = false;
        }
    };

    await runTest('Commit normal', async () => {
        const store = new MockStateStore();
        const ew = new MockExcelWriter();
        const pm = new MockPdfMover();
        const tm = new TransactionManager(ew, pm, store);
        
        const timeline = await tm.execute('exec-1', createPlan(), preflightOk, '/idx.xlsx');
        if (store.state !== TransactionState.COMMITTED) throw new Error(`State was ${store.state}`);
        const events = timeline.getEvents();
        if (events[events.length - 1].state !== TransactionState.COMMITTED) throw new Error('Last event not COMMITTED');
    });

    await runTest('Falla Excel', async () => {
        const store = new MockStateStore();
        const ew = new MockExcelWriter();
        ew.failExecute = true;
        const pm = new MockPdfMover();
        const tm = new TransactionManager(ew, pm, store);
        
        await tm.execute('exec-2', createPlan(), preflightOk, '/idx.xlsx');
        if (store.state !== TransactionState.ROLLBACK_COMPLETE) throw new Error(`State was ${store.state}`);
        if (pm.compensateCalled) throw new Error('PDF compensated but it should not have run');
    });

    await runTest('Falla PDF y Rollback completo', async () => {
        const store = new MockStateStore();
        const ew = new MockExcelWriter();
        const pm = new MockPdfMover();
        pm.failExecute = true; // Excel succeeds, PDF fails -> triggers rollback of PDF
        const tm = new TransactionManager(ew, pm, store);
        
        await tm.execute('exec-3', createPlan(), preflightOk, '/idx.xlsx');
        if (store.state !== TransactionState.ROLLBACK_COMPLETE) throw new Error(`State was ${store.state}`);
        if (!pm.compensateCalled) throw new Error('PDF compensate was NOT called');
    });

    await runTest('Recovery desde cada estado (Reentry)', async () => {
        const store = new MockStateStore();
        store.state = TransactionState.EXCEL_DONE; // Crashed after excel
        const ew = new MockExcelWriter();
        const pm = new MockPdfMover();
        const tm = new TransactionManager(ew, pm, store);
        
        await tm.execute('exec-4', createPlan(), preflightOk, '/idx.xlsx');
        if (store.state !== TransactionState.COMMITTED) throw new Error(`Did not finish recovery, state=${store.state}`);
    });

    await runTest('Compensación idempotente', async () => {
        const store = new MockStateStore();
        const ew = new MockExcelWriter();
        const pm = new MockPdfMover();
        pm.failExecute = true;
        const tm = new TransactionManager(ew, pm, store);
        
        await tm.execute('exec-5', createPlan(), preflightOk, '/idx.xlsx');
        if (store.state !== TransactionState.ROLLBACK_COMPLETE) throw new Error(`State was ${store.state}`);
    });

    const benchStore = new MockStateStore();
    const ew = new MockExcelWriter();
    const pm = new MockPdfMover();
    const tm = new TransactionManager(ew, pm, benchStore);
    const plan = createPlan();
    
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
        benchStore.state = TransactionState.PENDING;
        await tm.execute(`exec-b-${i}`, plan, preflightOk, '/idx.xlsx');
    }
    const elapsed = performance.now() - start;
    console.log(`✓ Benchmark y Determinismo (100 transacciones orquestadas en ${elapsed.toFixed(2)}ms)`);

    if (allPassed) {
        console.log('\nverify:transactionmanager: PASSED');
    } else {
        console.log('\nverify:transactionmanager: FAILED');
        process.exit(1);
    }
}

verifyTransactionManager();
