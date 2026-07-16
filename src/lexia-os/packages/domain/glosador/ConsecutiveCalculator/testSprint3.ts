import { StorageProvider } from '../StorageProvider/StorageProvider';
import { IndiceElectronicoReader } from '../IndiceElectronicoReader/IndiceElectronicoReader';
import { ConsecutiveCalculator } from './ConsecutiveCalculator';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

// Creamos un Mock del StorageProvider para las pruebas
class MockStorageProvider implements StorageProvider {
  constructor(private excelPath: string, private physicalFiles: string[]) {}

  async downloadFile(filePath: string): Promise<string> {
    return this.excelPath; // Devolvemos el path del excel temporal que creamos
  }
  async listFilesInFolder(folderPath: string): Promise<string[]> {
    return this.physicalFiles;
  }
  async findExpedienteFolders(query: string) { return []; }
  async findKnowledgeFolder(path: string) { return null; }
  async uploadFile(local: string, target: string) { return; }
  async moveFile(src: string, target: string) { return; }
  async createBackup(target: string) { return ''; }
}

async function runSprint3() {
  console.log('### Sprint 3 Reporte - Reconstruyendo el estado real del cuaderno\n');

  const tmpExcelPath = './tmp_000IndiceElectronico.xlsx';
  
  // Creamos un archivo Excel real usando exceljs
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Indice');
  
  // Fila 1: Encabezados
  sheet.addRow(['Número', 'Nombre del Documento', 'Páginas']);
  
  // Simulamos que el Excel está actualizado hasta el 17
  for (let i = 1; i <= 17; i++) {
    sheet.addRow([i, `Documento_Prueba_${i}.pdf`, 2]);
  }
  await workbook.xlsx.writeFile(tmpExcelPath);

  // ----------------------------------------------------
  // Caso 1: Expediente Consistente (Físico = 17, Excel = 17)
  // ----------------------------------------------------
  let provider = new MockStorageProvider(tmpExcelPath, [
    '001_Doc.pdf', '010_Doc.pdf', '017_Doc.pdf', '000IndiceElectronico.xlsx'
  ]);
  let reader = new IndiceElectronicoReader(provider);
  let calculator = new ConsecutiveCalculator(provider);

  let indiceResult = await reader.readLastConsecutive('/rutaremota/000IndiceElectronico.xlsx');
  let result = await calculator.calculate('/rutaremota/Conocimiento', indiceResult);
  
  console.log(`Caso 1: Expediente Consistente`);
  console.log(`Excel: ${result.excelConsecutive}`);
  console.log(`Carpeta: ${result.physicalConsecutive}`);
  if (result.hasInconsistency) {
    console.log(`Resultado: ⚠ Inconsistencia detectada. Acción: Revisión manual`);
  } else {
    console.log(`Resultado: ✔ Consistente. Acción: Sugerir ${result.proposedConsecutive}`);
  }
  console.log('---\n');


  // ----------------------------------------------------
  // Caso 2: Inconsistencia (Físico = 18, Excel = 17)
  // ----------------------------------------------------
  provider = new MockStorageProvider(tmpExcelPath, [
    '001_Doc.pdf', '017_Doc.pdf', '018_Memorial_Sin_Indexar.pdf', '000IndiceElectronico.xlsx'
  ]);
  reader = new IndiceElectronicoReader(provider);
  calculator = new ConsecutiveCalculator(provider);

  indiceResult = await reader.readLastConsecutive('/rutaremota/000IndiceElectronico.xlsx');
  result = await calculator.calculate('/rutaremota/Conocimiento', indiceResult);

  console.log(`Caso 2: Inconsistencia Detectada`);
  console.log(`Excel: ${result.excelConsecutive}`);
  console.log(`Carpeta: ${result.physicalConsecutive}`);
  if (result.hasInconsistency) {
    console.log(`Resultado: ⚠ Inconsistencia detectada. Acción: Revisión manual`);
  } else {
    console.log(`Resultado: ✔ Consistente. Acción: Sugerir ${result.proposedConsecutive}`);
  }
  console.log('---\n');


  // ----------------------------------------------------
  // Caso 3: Excel Dañado o sin Hoja 1
  // ----------------------------------------------------
  const tmpBadExcelPath = './tmp_bad.xlsx';
  const badWorkbook = new ExcelJS.Workbook();
  // Lo guardamos sin hojas
  await badWorkbook.xlsx.writeFile(tmpBadExcelPath);

  provider = new MockStorageProvider(tmpBadExcelPath, ['001_Doc.pdf']);
  reader = new IndiceElectronicoReader(provider);
  calculator = new ConsecutiveCalculator(provider);

  indiceResult = await reader.readLastConsecutive('/rutaremota/tmp_bad.xlsx');
  result = await calculator.calculate('/rutaremota/Conocimiento', indiceResult);

  console.log(`Caso 3: Excel Dañado`);
  console.log(`Estado Lectura: ${indiceResult.error}`);
  console.log(`Resultado: ⚠ Inconsistencia detectada. Acción: Revisión manual`);
  console.log('---\n');


  // Limpieza
  if (fs.existsSync(tmpExcelPath)) fs.unlinkSync(tmpExcelPath);
  if (fs.existsSync(tmpBadExcelPath)) fs.unlinkSync(tmpBadExcelPath);
}

runSprint3();
