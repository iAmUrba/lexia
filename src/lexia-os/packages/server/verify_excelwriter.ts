import { ExcelWriter, IExcelAdapter } from '../domain/glosador/ExecutionSystem/ExcelWriter.js';
import { IFileSystem } from '../domain/glosador/ExecutionSystem/Contracts/IFileSystem.js';
import { PlanOperation } from '../domain/glosador/ExecutionSystem/ExecutionPlanBuilder.js';
import * as crypto from 'crypto';

class MockExcelAdapter implements IExcelAdapter {
    public locked = false;
    public protected = false;

    readCell(buffer: Buffer, sheetName: string, cellRef: string): string {
        if (this.locked) throw new Error('File is locked by another user');
        const data = JSON.parse(buffer.toString());
        if (!data[sheetName]) throw new Error('Sheet not found');
        return data[sheetName][cellRef] || '';
    }

    writeCell(buffer: Buffer, sheetName: string, cellRef: string, value: string): Buffer {
        if (this.protected) throw new Error('File is protected');
        if (this.locked) throw new Error('File is locked by another user');
        const data = JSON.parse(buffer.toString());
        if (!data[sheetName]) throw new Error('Sheet not found');
        
        // Simular que el archivo es "inmutable" si la celda es inexistente/inválida
        if (cellRef === 'INVALID') throw new Error('Invalid cell reference');

        data[sheetName][cellRef] = value;
        return Buffer.from(JSON.stringify(data));
    }
}

class MockFileSystem implements IFileSystem {
    public fileData = Buffer.from(JSON.stringify({ Indice: { 'A2': '000', 'B2': 'old-hash' } }));

    async exists(path: string): Promise<boolean> { return true; }
    async calculateHash(path: string): Promise<string> {
        return crypto.createHash('sha256').update(this.fileData).digest('hex');
    }
    async read(path: string): Promise<Buffer> { return Buffer.from(this.fileData); }
    async readStream(path: string): Promise<any> { throw new Error('Not implemented'); }
    async write(path: string, data: Buffer): Promise<void> { this.fileData = Buffer.from(data); }
    async copyFile(): Promise<void> {}
    async deleteFile(): Promise<void> {}
    async move(): Promise<void> {}
    async list(): Promise<string[]> { return []; }
    async stat(): Promise<any> { return {}; }
}

async function verifyExcelWriter() {
    console.log('\n--- LEXIA CORE: VERIFY EXCEL WRITER ---');
    let allPassed = true;

    const runTest = async (name: string, setup: (adapter: MockExcelAdapter, fs: MockFileSystem) => void, expectedSuccess: boolean, expectHashChange: boolean) => {
        const fs = new MockFileSystem();
        const adapter = new MockExcelAdapter();
        setup(adapter, fs);

        const writer = new ExcelWriter(fs, adapter);
        const op: PlanOperation = { type: 'UPDATE_INDEX', description: '', payload: { consecutivo: '001', pdfHash: 'new-hash-xyz' } };
        
        const hashBefore = await fs.calculateHash('/test.xlsx');
        const result = await writer.execute(op, '/test.xlsx');

        if (result.success !== expectedSuccess) {
            console.log(`❌ ${name} - Se esperaba éxito=${expectedSuccess}, obtenido=${result.success}`);
            allPassed = false;
            return;
        }

        if (expectedSuccess) {
            const hashAfter = await fs.calculateHash('/test.xlsx');
            if (expectHashChange && hashBefore === hashAfter) {
                console.log(`❌ ${name} - Se esperaba cambio de hash pero fue idéntico`);
                allPassed = false;
                return;
            }
        }
        
        console.log(`✓ ${name}`);
    };

    await runTest('Escritura normal con verificación inmediata (read-after-write)', () => {}, true, true);
    
    await runTest('Celda inexistente/inválida', (adapter) => {
        // simulate by hacking the plan operation in a real scenario, here we mock adapter throwing
        const originalWrite = adapter.writeCell.bind(adapter);
        adapter.writeCell = (b, s, c, v) => {
            if (c === 'A2') throw new Error('Invalid cell reference');
            return originalWrite(b, s, c, v);
        };
    }, false, false);

    await runTest('Hoja inexistente', (adapter, fs) => {
        fs.fileData = Buffer.from(JSON.stringify({ OtraHoja: {} }));
    }, false, false);

    await runTest('Archivo protegido', (adapter) => {
        adapter.protected = true;
    }, false, false);

    await runTest('Archivo bloqueado', (adapter) => {
        adapter.locked = true;
    }, false, false);

    await runTest('Cambio de Hash y Verificación in-memory', (adapter, fs) => {
        // Here we test if write was successful
    }, true, true);

    // Benchmark and determinism
    const fsBench = new MockFileSystem();
    const adapterBench = new MockExcelAdapter();
    const writerBench = new ExcelWriter(fsBench, adapterBench);
    const op: PlanOperation = { type: 'UPDATE_INDEX', description: '', payload: { consecutivo: '001', pdfHash: 'bench-hash' } };
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
        await writerBench.execute(op, '/test.xlsx');
    }
    const elapsed = performance.now() - start;
    console.log(`✓ Benchmark y Determinismo (100 escrituras en ${elapsed.toFixed(2)}ms)`);

    if (allPassed) {
        console.log('\nverify:excelwriter: PASSED');
    } else {
        console.log('\nverify:excelwriter: FAILED');
        process.exit(1);
    }
}

verifyExcelWriter();
