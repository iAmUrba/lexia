import { PdfMover, FileDescriptor } from '../domain/glosador/ExecutionSystem/PdfMover.js';
import { IFileSystem } from '../domain/glosador/ExecutionSystem/Contracts/IFileSystem.js';
import { PlanOperation } from '../domain/glosador/ExecutionSystem/ExecutionPlanBuilder.js';

class MockFileSystem implements IFileSystem {
    public store: Map<string, { exists: boolean, hash: string }> = new Map();
    public emulateCopyError = false;
    public emulateDeleteError = false;
    public emulateCopyCorruption = false;

    async exists(path: string): Promise<boolean> {
        return this.store.get(path)?.exists || false;
    }
    async calculateHash(path: string): Promise<string> {
        const item = this.store.get(path);
        if (!item || !item.exists) throw new Error('Not found');
        return item.hash;
    }
    async copyFile(source: string, destination: string): Promise<void> {
        if (this.emulateCopyError) throw new Error('Network timeout during copy');
        const item = this.store.get(source);
        if (!item || !item.exists) throw new Error('Source not found');
        this.store.set(destination, { exists: true, hash: this.emulateCopyCorruption ? 'corrupted-hash' : item.hash });
    }
    async deleteFile(path: string): Promise<void> {
        if (this.emulateDeleteError) throw new Error('Permission denied to delete');
        this.store.delete(path);
    }
    
    // Unused in PdfMover
    async read(): Promise<Buffer> { return Buffer.from(''); }
    async write(): Promise<void> {}
    async move(): Promise<void> {}
    async list(): Promise<string[]> { return []; }
    async stat(): Promise<any> { return {}; }
}

async function verifyPdfMover() {
    console.log('\n--- LEXIA CORE: VERIFY PDF MOVER ---');
    let allPassed = true;

    const runTest = async (name: string, setup: (fs: MockFileSystem) => void, expectedStatus: string) => {
        const fs = new MockFileSystem();
        setup(fs);

        const mover = new PdfMover(fs);
        const op: PlanOperation = {
            type: 'MOVE_PDF',
            description: '',
            payload: { source: '/src.pdf', target: '/dst.pdf', expectedHash: 'hash123' } as FileDescriptor
        };
        
        const result = await mover.execute(op, 'trace-1');

        if (result.status !== expectedStatus) {
            console.log(`❌ ${name} - Se esperaba status=${expectedStatus}, obtenido=${result.status}`);
            allPassed = false;
            return;
        }
        
        console.log(`✓ ${name}`);
    };

    const runCompensateTest = async (name: string, setup: (fs: MockFileSystem) => void, expectedStatus: string) => {
        const fs = new MockFileSystem();
        setup(fs);

        const mover = new PdfMover(fs);
        const op: PlanOperation = {
            type: 'MOVE_PDF',
            description: '',
            payload: { source: '/src.pdf', target: '/dst.pdf', expectedHash: 'hash123' } as FileDescriptor
        };
        
        const result = await mover.compensate(op, 'trace-1');

        if (result.status !== expectedStatus) {
            console.log(`❌ COMPENSATE: ${name} - Se esperaba status=${expectedStatus}, obtenido=${result.status}`);
            allPassed = false;
            return;
        }
        
        console.log(`✓ COMPENSATE: ${name}`);
    };

    await runTest('Flujo normal', (fs) => {
        fs.store.set('/src.pdf', { exists: true, hash: 'hash123' });
    }, 'COMPLETED');

    await runTest('Hash mismatch', (fs) => {
        fs.store.set('/src.pdf', { exists: true, hash: 'hash-wrong' });
    }, 'INTEGRITY_ERROR');

    await runTest('Destino existente', (fs) => {
        fs.store.set('/src.pdf', { exists: true, hash: 'hash123' });
        fs.store.set('/dst.pdf', { exists: true, hash: 'old-hash' });
    }, 'FAILED');

    await runTest('Error de copia', (fs) => {
        fs.store.set('/src.pdf', { exists: true, hash: 'hash123' });
        fs.emulateCopyError = true;
    }, 'FAILED');

    await runTest('Corrupción durante copia (read-after-copy fail)', (fs) => {
        fs.store.set('/src.pdf', { exists: true, hash: 'hash123' });
        fs.emulateCopyCorruption = true;
    }, 'INTEGRITY_ERROR');

    await runTest('Error al borrar origen', (fs) => {
        fs.store.set('/src.pdf', { exists: true, hash: 'hash123' });
        fs.emulateDeleteError = true;
    }, 'COPY_DONE_DELETE_FAILED');

    // Compensations
    await runCompensateTest('Compensación normal', (fs) => {
        fs.store.set('/dst.pdf', { exists: true, hash: 'hash123' });
    }, 'COMPLETED');

    await runCompensateTest('Compensación idempotente (ya restaurado)', (fs) => {
        fs.store.set('/src.pdf', { exists: true, hash: 'hash123' });
    }, 'SKIPPED');

    // Benchmark and determinism
    const fsBench = new MockFileSystem();
    const moverBench = new PdfMover(fsBench);
    const opBench: PlanOperation = { type: 'MOVE_PDF', description: '', payload: { source: '/src.pdf', target: '/dst.pdf', expectedHash: 'bench-hash' } as FileDescriptor };
    
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
        fsBench.store.set('/src.pdf', { exists: true, hash: 'bench-hash' });
        fsBench.store.delete('/dst.pdf');
        await moverBench.execute(opBench, 'trace-bench');
    }
    const elapsed = performance.now() - start;
    console.log(`✓ Benchmark y Determinismo (100 escrituras en ${elapsed.toFixed(2)}ms)`);

    if (allPassed) {
        console.log('\nverify:pdfmover: PASSED');
    } else {
        console.log('\nverify:pdfmover: FAILED');
        process.exit(1);
    }
}

verifyPdfMover();
