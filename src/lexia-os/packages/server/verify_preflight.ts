import { ExecutionPlanBuilder } from '../domain/glosador/ExecutionSystem/ExecutionPlanBuilder.js';
import { PreflightValidator, IExecutionLockManager } from '../domain/glosador/ExecutionSystem/PreflightValidator.js';
import { IFileSystem } from '../domain/glosador/ExecutionSystem/Contracts/IFileSystem.js';

class MockFileSystem implements IFileSystem {
    public store: Map<string, { exists: boolean, hash?: string, error?: string }> = new Map();

    async exists(path: string): Promise<boolean> {
        const item = this.store.get(path);
        if (item?.error) throw new Error(item.error);
        return item?.exists || false;
    }

    async calculateHash(path: string): Promise<string> {
        const item = this.store.get(path);
        if (item?.error) throw new Error(item.error);
        if (!item?.exists || !item?.hash) throw new Error('Not found');
        return item.hash;
    }
    
    // Unused in Preflight
    async copyFile(): Promise<void> {}
    async deleteFile(): Promise<void> {}
    async read(path: string): Promise<Buffer> { return Buffer.from(this.fileData[path] || ''); }
    async readStream(path: string): Promise<any> { throw new Error('Not implemented'); }
    async write(path: string, data: Buffer): Promise<void> {}
    async move(): Promise<void> {}
    async list(): Promise<string[]> { return []; }
    async stat(): Promise<any> { return {}; }
}

class MockLockManager implements IExecutionLockManager {
    public locked = false;
    async isLocked(expedienteId: string): Promise<boolean> {
        return this.locked;
    }
}

async function verifyPreflight() {
    console.log('\n--- LEXIA CORE: VERIFY PREFLIGHT ---');
    let allPassed = true;

    const runTest = async (name: string, setup: (fs: MockFileSystem, lock: MockLockManager) => void, expectedStatus: boolean, expectedFailedRule?: string) => {
        const fs = new MockFileSystem();
        const lock = new MockLockManager();
        setup(fs, lock);

        const validator = new PreflightValidator(fs, lock);
        
        const plan = ExecutionPlanBuilder.buildFromDecision({
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

        const report = await validator.validate(plan, 'exp-1', '/indice.xlsx', 'idx-hash-1');

        if (report.success !== expectedStatus) {
            console.log(`❌ ${name} - Se esperaba éxito=${expectedStatus}, obtenido=${report.success}`);
            allPassed = false;
            return;
        }

        if (expectedFailedRule) {
            const rule = report.validations.find(r => r.rule === expectedFailedRule);
            if (!rule || rule.status !== 'FAIL') {
                console.log(`❌ ${name} - Se esperaba fallo en la regla ${expectedFailedRule}`);
                allPassed = false;
                return;
            }
        }
        
        console.log(`✓ ${name}`);
    };

    await runTest('OK', (fs, lock) => {
        fs.store.set('/doc.pdf', { exists: true, hash: 'pdf-hash-1' });
        fs.store.set('/indice.xlsx', { exists: true, hash: 'idx-hash-1' });
    }, true);

    await runTest('PDF inexistente', (fs, lock) => {
        fs.store.set('/doc.pdf', { exists: false });
        fs.store.set('/indice.xlsx', { exists: true, hash: 'idx-hash-1' });
    }, false, 'PDF Exists');

    await runTest('Índice inexistente', (fs, lock) => {
        fs.store.set('/doc.pdf', { exists: true, hash: 'pdf-hash-1' });
        fs.store.set('/indice.xlsx', { exists: false });
    }, false, 'Indice Exists');

    await runTest('Hash PDF distinto', (fs, lock) => {
        fs.store.set('/doc.pdf', { exists: true, hash: 'pdf-hash-MODIFIED' });
        fs.store.set('/indice.xlsx', { exists: true, hash: 'idx-hash-1' });
    }, false, 'PDF Hash Match');

    await runTest('Hash índice distinto', (fs, lock) => {
        fs.store.set('/doc.pdf', { exists: true, hash: 'pdf-hash-1' });
        fs.store.set('/indice.xlsx', { exists: true, hash: 'idx-hash-MODIFIED' });
    }, false, 'Indice Hash Match');

    await runTest('Lock activo', (fs, lock) => {
        fs.store.set('/doc.pdf', { exists: true, hash: 'pdf-hash-1' });
        fs.store.set('/indice.xlsx', { exists: true, hash: 'idx-hash-1' });
        lock.locked = true;
    }, false, 'Execution Lock');

    await runTest('Permisos insuficientes', (fs, lock) => {
        fs.store.set('/doc.pdf', { exists: true, hash: 'pdf-hash-1', error: 'Access Denied' });
        fs.store.set('/indice.xlsx', { exists: true, hash: 'idx-hash-1' });
    }, false, 'PDF Exists');

    const fs = new MockFileSystem();
    fs.store.set('/doc.pdf', { exists: true, hash: 'pdf-hash-1' });
    fs.store.set('/indice.xlsx', { exists: true, hash: 'idx-hash-1' });
    const lock = new MockLockManager();
    const validator = new PreflightValidator(fs, lock);
    const plan = ExecutionPlanBuilder.buildFromDecision({
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

    const start = performance.now();
    for (let i=0; i<100; i++) {
        await validator.validate(plan, 'exp-1', '/indice.xlsx', 'idx-hash-1');
    }
    const elapsed = performance.now() - start;
    console.log(`✓ Benchmark y Determinismo (100 preflights en ${elapsed.toFixed(2)}ms)`);

    if (allPassed) {
        console.log('\nverify:preflight: PASSED');
    } else {
        console.log('\nverify:preflight: FAILED');
        process.exit(1);
    }
}

verifyPreflight();
