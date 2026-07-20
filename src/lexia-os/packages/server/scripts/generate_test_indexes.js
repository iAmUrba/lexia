import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexesDir = path.resolve(__dirname, '../../testdata/indexes');

if (!fs.existsSync(indexesDir)) {
    fs.mkdirSync(indexesDir, { recursive: true });
}

// Helper to create a basic index
async function createBaseIndex(filename, setupFn) {
    const workbook = new ExcelJS.Workbook();
    setupFn(workbook);
    await workbook.xlsx.writeFile(path.join(indexesDir, filename));
    console.log(`Generated ${filename}`);
}

async function generateAll() {
    // 1. Normal
    await createBaseIndex('normal.xlsx', (wb) => {
        const sheet = wb.addWorksheet('Indice');
        sheet.columns = [
            { header: 'Consecutivo', key: 'consecutivo' },
            { header: 'Nombre Documento', key: 'nombre' },
            { header: 'Fecha', key: 'fecha' }
        ];
        sheet.addRow({ consecutivo: 1, nombre: 'Demanda', fecha: '2023-01-01' });
        sheet.addRow({ consecutivo: 2, nombre: 'Auto admisorio', fecha: '2023-01-02' });
        sheet.addRow({ consecutivo: 3, nombre: 'Notificación', fecha: '2023-01-03' });
    });

    // 2. Huecos (vacíos) y saltos
    await createBaseIndex('huecos.xlsx', (wb) => {
        const sheet = wb.addWorksheet('Indice');
        sheet.columns = [
            { header: 'Consecutivo', key: 'consecutivo' },
            { header: 'Nombre Documento', key: 'nombre' }
        ];
        sheet.addRow({ consecutivo: 1, nombre: 'Doc 1' });
        sheet.addRow([]); // Empty row
        sheet.addRow({ consecutivo: 3, nombre: 'Doc 3' }); // Gap in consecutive
        sheet.addRow({ consecutivo: 4, nombre: 'Doc 4' });
    });

    // 3. Sin Fórmulas (actually in real world it's just values, our normal is already without formulas, let's make one WITH formulas that are correct, and one with broken)
    await createBaseIndex('sin_formulas.xlsx', (wb) => {
        const sheet = wb.addWorksheet('Indice');
        sheet.columns = [ { header: 'Consecutivo' } ];
        sheet.addRow([1]);
        sheet.addRow([2]);
        sheet.addRow([3]);
    });

    // 4. Con Fórmulas
    await createBaseIndex('con_formulas.xlsx', (wb) => {
        const sheet = wb.addWorksheet('Indice');
        sheet.columns = [ { header: 'Consecutivo' } ];
        sheet.addRow([1]);
        sheet.addRow([{ formula: 'A2+1', result: 2 }]);
        sheet.addRow([{ formula: 'A3+1', result: 3 }]);
    });

    // 5. REF / Fórmulas dañadas
    await createBaseIndex('ref.xlsx', (wb) => {
        const sheet = wb.addWorksheet('Indice');
        sheet.columns = [ { header: 'Consecutivo' } ];
        sheet.addRow([1]);
        sheet.addRow([{ formula: '#REF!+1', result: { error: '#REF!' } }]);
    });

    // 6. Protegido
    // ExcelJS doesn't fully support encrypting with a password for OPENING the file easily in community edition, 
    // but we can protect the worksheet to simulate structural protection.
    await createBaseIndex('protegido.xlsx', (wb) => {
        const sheet = wb.addWorksheet('Indice');
        sheet.columns = [ { header: 'Consecutivo' } ];
        sheet.addRow([1]);
        sheet.protect('password123', { selectLockedCells: false });
    });

    // 7. Duplicados por nombre
    // We will just copy normal.xlsx
    fs.copyFileSync(path.join(indexesDir, 'normal.xlsx'), path.join(indexesDir, '000Indice.xlsx'));
    fs.copyFileSync(path.join(indexesDir, 'normal.xlsx'), path.join(indexesDir, '000Indice (1).xlsx'));

    // 8. Columnas desordenadas
    await createBaseIndex('columnas_desordenadas.xlsx', (wb) => {
        const sheet = wb.addWorksheet('Indice');
        sheet.columns = [
            { header: 'Fecha', key: 'fecha' },
            { header: 'Consecutivo', key: 'consecutivo' },
            { header: 'Observaciones', key: 'obs' },
            { header: 'Nombre Documento', key: 'nombre' }
        ];
        sheet.addRow({ fecha: '2023-01-01', consecutivo: 1, obs: '', nombre: 'Doc A' });
    });

    // 9. Consecutivos no numéricos
    await createBaseIndex('consecutivos_no_numericos.xlsx', (wb) => {
        const sheet = wb.addWorksheet('Indice');
        sheet.columns = [
            { header: 'Consecutivo', key: 'consecutivo' },
            { header: 'Nombre', key: 'nombre' }
        ];
        sheet.addRow({ consecutivo: '001', nombre: 'Doc 1' });
        sheet.addRow({ consecutivo: '002', nombre: 'Doc 2' });
        sheet.addRow({ consecutivo: '002A', nombre: 'Doc 2A' });
        sheet.addRow({ consecutivo: '003', nombre: 'Doc 3' });
    });

    // 10. Varias hojas
    await createBaseIndex('varias_hojas.xlsx', (wb) => {
        const sheet1 = wb.addWorksheet('Hoja1'); // Random sheet
        sheet1.addRow(['Nada', 'que', 'ver', 'aqui']);

        const sheet2 = wb.addWorksheet('Indice Electronico'); // The actual index
        sheet2.columns = [
            { header: 'Consecutivo', key: 'consecutivo' },
            { header: 'Nombre Documento', key: 'nombre' }
        ];
        sheet2.addRow({ consecutivo: 1, nombre: 'Real doc' });
    });
    
    // 11. Malformed (just a text file with .xlsx extension)
    fs.writeFileSync(path.join(indexesDir, 'malformed.xlsx'), 'This is not an excel file');
}

generateAll().catch(console.error);
