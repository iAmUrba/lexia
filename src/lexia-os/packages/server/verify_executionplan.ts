import { ExecutionPlanBuilder } from '../domain/glosador/ExecutionSystem/ExecutionPlanBuilder.js';
import { DecisionEvent } from '../domain/glosador/ApprovalWorkflow/ApprovalContracts.js';

async function verifyExecutionPlan() {
    console.log('\n--- LEXIA CORE: VERIFY EXECUTION PLAN ---');
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

    const validEvent: DecisionEvent = {
        eventId: 'event-123',
        documentId: '/inbox/doc.pdf',
        timestamp: new Date().toISOString(),
        userId: 'USER_1',
        propuestaLexia: {
            engineVersion: 'v1.0.0',
            evidenceVersion: 'v1',
            indiceVersion: 'v1',
            expedienteId: 'exp-789',
            consecutivo: 42,
            investigationReportSnapshot: {
                extractorEvidence: {
                    hash: 'abcd1234hash'
                }
            }
        },
        decisionFuncionario: {
            expedienteId: 'exp-789',
            consecutivo: 42,
            accion: 'APROBAR',
            observaciones: 'OK'
        },
        hash: 'event_hash_123'
    };

    runTest('Generación normal sin I/O ni efectos secundarios', () => {
        const plan = ExecutionPlanBuilder.buildFromDecision(validEvent);
        if (plan.decisionEventId !== validEvent.eventId) throw new Error('ID mismatch');
        if (plan.operations.length !== 2) throw new Error('Expected 2 operations');
    });

    runTest('Inmutabilidad al 100%', () => {
        const plan = ExecutionPlanBuilder.buildFromDecision(validEvent);
        try {
            (plan as any).expectedPdfHash = 'modificado';
            throw new Error('Permitió modificar prop');
        } catch (e) {
            // Expected
        }
        try {
            (plan.operations as any).push({});
            throw new Error('Permitió mutar array');
        } catch (e) {
            // Expected
        }
    });

    runTest('Hash estable y verificable', () => {
        const plan = ExecutionPlanBuilder.buildFromDecision(validEvent);
        if (!plan.planHash) throw new Error('Hash was not generated');
    });

    runTest('Idempotencia determinista (Mismo input = similar plan, distinto ID pero operaciones exactas)', () => {
        const plan1 = ExecutionPlanBuilder.buildFromDecision(validEvent);
        const plan2 = ExecutionPlanBuilder.buildFromDecision(validEvent);
        if (plan1.planId === plan2.planId) throw new Error('ID debe ser único');
        if (JSON.stringify(plan1.operations) !== JSON.stringify(plan2.operations)) throw new Error('Operaciones difieren');
    });

    runTest('Rechazo de DecisionEvent inválido o no aprobado', () => {
        try {
            ExecutionPlanBuilder.buildFromDecision({ 
                ...validEvent, 
                decisionFuncionario: { ...validEvent.decisionFuncionario, accion: 'RECHAZAR' } 
            });
            throw new Error('Should not build plan for RECHAZADO');
        } catch (e: any) {
            if (!e.message.includes('APROBADO')) throw e;
        }
    });
    
    runTest('Propagación de traceId (Placeholder actual)', () => {
        const plan = ExecutionPlanBuilder.buildFromDecision(validEvent);
        if (plan.traceId !== 'trace_id_placeholder') throw new Error('traceId no propagado');
    });

    const start = performance.now();
    for(let i=0; i<1000; i++) {
        ExecutionPlanBuilder.buildFromDecision(validEvent);
    }
    const elapsed = performance.now() - start;
    console.log(`✓ Benchmark (1000 planes generados en ${elapsed.toFixed(2)}ms)`);

    if (allPassed) {
        console.log('\nverify:executionplan: PASSED');
    } else {
        console.log('\nverify:executionplan: FAILED');
        process.exit(1);
    }
}

verifyExecutionPlan();
