import { ExcelJSAdapter } from '../../domain/glosador/IndiceSystem/Adapter/ExcelJSAdapter.js';
import { IndiceReader } from '../../domain/glosador/IndiceSystem/IndiceReader.js';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    console.log('Generating 5000 rows index...');
    const p = path.resolve(__dirname, '../../testdata/indexes/stress.xlsx');
    
    // Create dir if needed
    if (!fs.existsSync(path.dirname(p))) {
        fs.mkdirSync(path.dirname(p), { recursive: true });
    }

    const wb = new ExcelJS.Workbook();
    const sh = wb.addWorksheet('Indice');
    sh.columns = [{header: 'Consecutivo'}, {header: 'Nombre'}, {header: 'Fecha'}];
    for (let i = 1; i <= 5000; i++) {
        sh.addRow([i, `Doc ${i}`, '2023-01-01']);
    }
    await wb.xlsx.writeFile(p);
    console.log('Done generating.');

    const adapter = new ExcelJSAdapter();
    const reader = new IndiceReader(adapter);

    const memBefore = process.memoryUsage().heapUsed;
    const start = performance.now();
    
    // Simulate concurrent read lock by opening file in r+ mode if possible, but actually we just want to ensure we don't lock it.
    // In Node, we can just check if we can rename it right after reading.
    const data = await reader.read(p);
    
    const time = performance.now() - start;
    const memAfter = process.memoryUsage().heapUsed;
    const memDiffMB = (memAfter - memBefore) / 1024 / 1024;

    console.log(`Read ${data.registros.length} records in ${time.toFixed(2)}ms`);
    console.log(`Memory delta: ${memDiffMB.toFixed(2)} MB`);

    // Check if we can rename (handle is closed)
    const newPath = p + '.renamed';
    try {
        fs.renameSync(p, newPath);
        console.log('✓ File handle closed (rename successful)');
        fs.renameSync(newPath, p); // revert
    } catch (e) {
        console.log('❌ File handle still open!', e);
    }
}

run().catch(console.error);
