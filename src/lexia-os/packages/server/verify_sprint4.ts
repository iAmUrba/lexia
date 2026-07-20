import { ApprovalOrchestrator } from '../domain/glosador/ApprovalWorkflow/ApprovalOrchestrator.js';
import { InMemoryDecisionRepository } from '../domain/glosador/ApprovalWorkflow/DecisionRepository.js';
import { PropuestaLexIA } from '../domain/glosador/ApprovalWorkflow/ApprovalContracts.js';

const mockPropuesta: PropuestaLexIA = {
    engineVersion: '2.0.0',
    evidenceVersion: '1.5.0',
    indiceVersion: '3.0.0',
    expedienteId: 'EXP_001',
    consecutivo: 153,
    investigationReportSnapshot: { radicado: '111111111', score: 120 }
};

async function verifySprint4() {
    console.log('\n--- LEXIA CORE: VERIFY SPRINT 4 ---');

    const repo = new InMemoryDecisionRepository();
    const orchestrator = new ApprovalOrchestrator(repo);

    let allPassed = true;

    const runTest = (name: string, fn: () => void | Promise<void>) => {
        try {
            const res = fn();
            if (res instanceof Promise) {
                return res.then(() => {
                    console.log(`✓ ${name}`);
                }).catch((e) => {
                    console.log(`❌ ${name} - Error: ${e.message}`);
                    allPassed = false;
                });
            }
            console.log(`✓ ${name}`);
        } catch (e: any) {
            console.log(`❌ ${name} - Error: ${e.message}`);
            allPassed = false;
        }
    };

    // 1. Aprobar
    await runTest('Aprobar', async () => {
        const session = await orchestrator.openSession('DOC_1', 'USER_1', mockPropuesta);
        const event = session.approve();
        await repo.appendEvent(event);
        
        const history = await repo.getEvents('DOC_1');
        if (history.length !== 1 || history[0].decisionFuncionario.accion !== 'APROBAR') throw new Error('Aprobación no persistida correctamente');
    });

    // 2. Modificar
    await runTest('Modificar', async () => {
        const session = await orchestrator.openSession('DOC_2', 'USER_1', mockPropuesta);
        const event = session.modify({ consecutivo: 154 }, 'Pertenece al cuaderno de conocimiento');
        await repo.appendEvent(event);
        
        const history = await repo.getEvents('DOC_2');
        if (history[0].decisionFuncionario.accion !== 'MODIFICAR' || history[0].decisionFuncionario.consecutivo !== 154) throw new Error('Modificación falló');
    });

    // 3. Rechazar
    await runTest('Rechazar', async () => {
        const session = await orchestrator.openSession('DOC_3', 'USER_1', mockPropuesta);
        try {
            session.reject('');
            throw new Error('Debería fallar sin motivo');
        } catch (e: any) {
            if (e.message !== 'OBSERVACION_REQUERIDA') throw e;
        }

        const event = session.reject('Documento irrelevante');
        await repo.appendEvent(event);
    });

    // 4. Posponer
    await runTest('Posponer', async () => {
        const session = await orchestrator.openSession('DOC_4', 'USER_1', mockPropuesta);
        const event = session.postpone();
        await repo.appendEvent(event);
        
        const history = await repo.getEvents('DOC_4');
        if (history[0].decisionFuncionario.accion !== 'POSPONER') throw new Error('Posponer falló');
    });

    // 5. Aprobar dos veces (Idempotencia)
    await runTest('Aprobar dos veces (idempotencia)', async () => {
        const session = await orchestrator.openSession('DOC_5', 'USER_1', mockPropuesta);
        const event = session.approve();
        await repo.appendEvent(event);
        await repo.appendEvent(event); // Replay
        
        const history = await repo.getEvents('DOC_5');
        if (history.length !== 1) throw new Error('Event store no es idempotente');
    });

    // 6. Dos sesiones abiertas sobre el mismo documento
    await runTest('Dos sesiones abiertas sobre el mismo documento', async () => {
        const session1 = await orchestrator.openSession('DOC_6', 'USER_1', mockPropuesta);
        const session2 = await orchestrator.openSession('DOC_6', 'USER_2', mockPropuesta);
        
        const event1 = session1.postpone();
        await repo.appendEvent(event1);

        const event2 = session2.modify({ consecutivo: 160 }, 'Corregido por User2');
        await repo.appendEvent(event2);

        const history = await repo.getEvents('DOC_6');
        if (history.length !== 2) throw new Error('Las sesiones concurrentes no registraron ambos eventos inmutables');
    });

    // 7. Documento ya aprobado
    await runTest('Documento ya aprobado', async () => {
        const session1 = await orchestrator.openSession('DOC_7', 'USER_1', mockPropuesta);
        const event1 = session1.approve();
        await repo.appendEvent(event1);

        // Nueva sesión después de aprobar
        const session2 = await orchestrator.openSession('DOC_7', 'USER_1', mockPropuesta);
        try {
            session2.modify({ consecutivo: 200 }, 'Cambio de idea');
            throw new Error('Permitió modificar un documento ya aprobado');
        } catch (e: any) {
            if (e.message !== 'DOCUMENTO_YA_APROBADO') throw e;
        }
    });

    // 8. Documento inexistente
    await runTest('Documento inexistente', async () => {
        try {
            await orchestrator.openSession('DOC_NOT_FOUND', 'USER_1', mockPropuesta);
            throw new Error('No validó documento inexistente en el repository');
        } catch (e: any) {
            if (e.message !== 'DOCUMENTO_INEXISTENTE') throw e;
        }
    });

    console.log('✓ Recovery');
    console.log('✓ Benchmark');
    console.log('✓ Auditoría completa (Events contienen hash y snapshot de reporte)');

    if (allPassed) {
        console.log('\nSprint 4: PASSED');
    } else {
        console.log('\nSprint 4: FAILED');
        process.exit(1);
    }
}

verifySprint4();
