import { ExecutionPlanBuilder, ExecutionPlan } from '../domain/glosador/ExecutionSystem/ExecutionPlanBuilder.js';
import { PreflightReport } from '../domain/glosador/ExecutionSystem/PreflightValidator.js';
import { DryRunExecutor, DryRunReport } from '../domain/glosador/ExecutionSystem/DryRunExecutor.js';

function createValidPlan(): ExecutionPlan {
    return ExecutionPlanBuilder.buildFromDecision({
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
}

function createEmptyPlan(): ExecutionPlan {
    // Hack to create empty plan since builder doesn't allow it
    const p = createValidPlan();
    return { ...p, operations: [] } as ExecutionPlan;
}

async function verifyDryRun() {
    console.log('\n--- LEXIA CORE: VERIFY DRY RUN ---');
    let allPassed = true;

    const runTest = (name: string, fn: () => void) => {
        try {
            fn();
            console.log(`✓ ${name}`);
        } catch (e: any) {
            console.log(`❌ ${name} - Error: ${e.message}`);
            allPassed = false;
        }
    };

    const executor = new DryRunExecutor();
    
    runTest('Flujo normal', () => {
        const plan = createValidPlan();
        const preflight = new PreflightReport(true, new Date().toISOString(), plan.planHash, [], { durationMs: 1 });
        const report = executor.execute(plan, preflight);
        if (!report.ready) throw new Error('Debería estar ready');
        if (report.operations.length !== 2) throw new Error('Faltan operaciones');
        if (report.operations[0].status !== 'READY') throw new Error('Op 0 no está READY');
        if (report.traceId !== plan.traceId) throw new Error('TraceId no propagado');
    });

    runTest('Preflight fallido', () => {
        const plan = createValidPlan();
        const preflight = new PreflightReport(false, new Date().toISOString(), plan.planHash, [{ rule: 'F', status: 'FAIL' }], { durationMs: 1 });
        const report = executor.execute(plan, preflight);
        if (report.ready) throw new Error('No debería estar ready');
        if (report.operations[0].status !== 'BLOCKED') throw new Error('Op 0 debería estar BLOCKED');
        if (report.warnings.length === 0) throw new Error('Faltan warnings');
    });

    runTest('Plan vacío', () => {
        const plan = createEmptyPlan();
        const preflight = new PreflightReport(true, new Date().toISOString(), plan.planHash, [], { durationMs: 1 });
        const report = executor.execute(plan, preflight);
        if (report.warnings.length === 0) throw new Error('Faltan warnings sobre plan vacío');
    });

    runTest('Lock activo (Vía preflight fallido)', () => {
        const plan = createValidPlan();
        const preflight = new PreflightReport(false, new Date().toISOString(), plan.planHash, [{ rule: 'Execution Lock', status: 'FAIL' }], { durationMs: 1 });
        const report = executor.execute(plan, preflight);
        if (report.ready) throw new Error('Debe bloquear por lock');
        if (report.operations[0].status !== 'BLOCKED') throw new Error('Ops deben estar blocked');
    });

    runTest('Determinismo', () => {
        const plan = createValidPlan();
        const preflight = new PreflightReport(true, new Date().toISOString(), plan.planHash, [], { durationMs: 1 });
        const report1 = executor.execute(plan, preflight);
        const report2 = executor.execute(plan, preflight);
        if (report1.executionId === report2.executionId) throw new Error('Execution ID debe ser único');
        if (report1.ready !== report2.ready) throw new Error('Diferente resultado de ready');
        if (JSON.stringify(report1.operations) !== JSON.stringify(report2.operations)) throw new Error('Operaciones difieren');
    });

    const start = performance.now();
    const planBench = createValidPlan();
    const preflightBench = new PreflightReport(true, new Date().toISOString(), planBench.planHash, [], { durationMs: 1 });
    for(let i=0; i<1000; i++) {
        executor.execute(planBench, preflightBench);
    }
    const elapsed = performance.now() - start;
    console.log(`✓ Benchmark (1000 DryRuns en ${elapsed.toFixed(2)}ms)`);

    if (allPassed) {
        console.log('\nverify:dryrun: PASSED');
    } else {
        console.log('\nverify:dryrun: FAILED');
        process.exit(1);
    }
}

verifyDryRun();
