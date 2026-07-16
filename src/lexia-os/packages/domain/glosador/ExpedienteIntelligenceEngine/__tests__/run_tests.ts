import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import { ExcelReader, ExpedienteDigitalVivo, AnomalyDetector } from '../index.js';
import { StorageProvider } from '../../../StorageProvider/StorageProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');

// Mock StorageProvider for testing
class MockStorageProvider implements StorageProvider {
  async downloadFile(fileId: string): Promise<string> {
    return fileId; // fileId is the absolute path to the fixture
  }
  async findExpedienteFolders(query: string): Promise<string[]> { return []; }
  async listFilesInFolder(folderId: string): Promise<string[]> { return []; }
}

async function createFixture(name: string, buildFn: (ws: ExcelJS.Worksheet) => void): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Indice');
  buildFn(ws);
  const filePath = path.join(fixturesDir, `${name}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

async function generateFixtures() {
  const paths: Record<string, string> = {};

  // Caso 1 - Perfecto
  paths.perfecto = await createFixture('1_perfecto', ws => {
    ws.addRow(['Juzgado Promiscuo Municipal']);
    ws.addRow(['Radicado:', '11001310700320230012300']);
    ws.addRow(['Demandado:', 'JUAN PEREZ']);
    ws.addRow([]);
    ws.addRow(['Consecutivo', 'Fecha', 'Documento', 'Páginas']);
    ws.addRow([1, '10/01/2023', 'Demanda', 10]);
    ws.addRow([2, '11/01/2023', 'Auto Admisorio', 2]);
    ws.addRow([3, '12/01/2023', 'Notificación', 1]);
  });

  // Caso 2 - Faltan físicos (lo probaremos pasando array incompleto de archivos)
  paths.missing_file = await createFixture('2_missing_file', ws => {
    ws.addRow(['Juzgado Promiscuo Municipal']);
    ws.addRow(['Radicado:', '11001310700320230012400']);
    ws.addRow(['Demandado:', 'MARIA GOMEZ']);
    ws.addRow([]);
    ws.addRow(['Consecutivo', 'Fecha', 'Documento', 'Páginas']);
    ws.addRow([1, '10/01/2023', 'Carátula', 1]);
    ws.addRow([2, '11/01/2023', 'Acta', 2]);
    ws.addRow([3, '12/01/2023', 'Memorial Fiscalía', 5]);
    ws.addRow([4, '13/01/2023', 'Oficio', 1]);
  });

  // Caso 3 - Duplicado
  paths.duplicado = await createFixture('3_duplicado', ws => {
    ws.addRow(['Juzgado']);
    ws.addRow(['Radicado:', '11001310700320230012500']);
    ws.addRow(['Procesado:', 'CARLOS RUIZ']);
    ws.addRow(['Consecutivo', 'Fecha', 'Documento', 'Páginas']);
    ws.addRow([14, '10/01/2023', 'Memorial', 2]);
    ws.addRow([15, '11/01/2023', 'Auto', 1]);
    ws.addRow([15, '12/01/2023', 'Memorial', 3]); // DUPLICADO
  });

  // Caso 4 - Salto (Gap)
  paths.gap = await createFixture('4_gap', ws => {
    ws.addRow(['Radicado: 11001310700320230012600']);
    ws.addRow(['Demandado: ANA TORRES']);
    ws.addRow(['Consecutivo', 'Fecha', 'Documento', 'Páginas']);
    ws.addRow([18, '10/01/2023', 'Sentencia', 10]);
    ws.addRow([20, '12/01/2023', 'Apelación', 5]); // SALTO (Falta 19)
  });

  // Caso 5 - Encabezados raros
  paths.raro = await createFixture('5_encabezados_raros', ws => {
    ws.addRow(['Radicado 11001310700320230012700']);
    ws.addRow(['Imputado: LUIS FERNANDO']);
    ws.addRow(['No.', 'Fecha', 'Actuación', 'Folios']);
    ws.addRow([1, '10/01/2023', 'Poder', 1]);
    ws.addRow([2, '11/01/2023', 'Demanda', 12]);
  });

  // Caso 6 - Dañado por humanos
  paths.humano = await createFixture('6_danado_humano', ws => {
    ws.mergeCells('A1:D1');
    ws.getCell('A1').value = 'JUZGADO PRIMERO PENAL DEL CIRCUITO';
    ws.addRow([]);
    ws.addRow(['EXPEDIENTE:', '11001310700320230012800']);
    ws.addRow(['PROCESADO:', 'CARMEN JULIA']);
    ws.addRow([]);
    ws.addRow(['--- NOTA: Faltan folios del cuaderno 2 ---']);
    ws.addRow([]);
    ws.addRow(['Consecutivo', 'Documento', 'Fecha', 'Páginas']);
    ws.addRow([1, 'Inicio', '10/01/2023', 1]);
    ws.addRow([]); // Fila en blanco en medio
    ws.addRow([2, 'Auto', '11/01/2023', 2]);
  });

  return paths;
}

function printFichaViva(profile: ExpedienteDigitalVivo, testName: string) {
  console.log(`\n══════════════════════════════════════════════════════`);
  console.log(`TEST: ${testName.toUpperCase()}`);
  console.log(`══════════════════════════════════════════════════════`);
  console.log(`EXPEDIENTE DIGITAL VIVO (EDV)`);
  console.log(`══════════════════════════════════════════════════════`);
  console.log(`Radicado: ${profile.radicado}`);
  console.log(`Procesado/Demandado: ${profile.procesado}`);
  console.log(`Despacho: ${profile.despacho}`);
  console.log(`\nDocumentos registrados: ${profile.totalDocumentos}`);
  console.log(`Último consecutivo: ${profile.ultimoConsecutivo}`);
  console.log(`Última actuación: ${profile.ultimaActuacion}`);
  console.log(`Total páginas: ${profile.totalPaginas}`);
  
  console.log(`\nEstado de confianza general: ${profile.trustStatus}`);
  console.log(`Anomalías detectadas: ${profile.anomalias.length}`);
  
  if (profile.anomalias.length > 0) {
    profile.anomalias.forEach(a => {
      let icon = '🔵';
      if (a.severity === 'CRITICAL') icon = '🔴';
      else if (a.severity === 'WARNING') icon = '🟡';
      
      console.log(`${icon} [${a.type}]`);
      console.log(`   Diagnóstico: ${a.diagnostic}`);
      console.log(`   Riesgo: ${a.risk}`);
      console.log(`   Acción sugerida: ${a.suggestedAction}`);
      console.log(`   Nivel de automatización: [${a.automationLevel}]`);
      console.log(``);
    });
    console.log(`Decisión del motor: ⚠ Requiere intervención o confirmación humana.`);
  } else {
    console.log(`\nDecisión del motor: ✅ Todo en orden. Flujo automático autorizado.`);
  }
  console.log(`══════════════════════════════════════════════════════\n`);
}

async function runTests() {
  const paths = await generateFixtures();
  const reader = new ExcelReader(new MockStorageProvider());
  const detector = new AnomalyDetector();

  // Caso 1: Perfecto
  let index = await reader.parseIndex(paths.perfecto);
  let profile = new ExpedienteDigitalVivo(index, detector);
  profile.reconcilePhysicalFiles(['01_Demanda.pdf', '02_Auto.pdf', '03_Notificacion.pdf']);
  printFichaViva(profile, 'Caso 1 - Perfecto');

  // Caso 2: Falta el 03
  index = await reader.parseIndex(paths.missing_file);
  profile = new ExpedienteDigitalVivo(index, detector);
  profile.reconcilePhysicalFiles(['01_Caratula.pdf', '02_Acta.pdf', '04_Oficio.pdf']); // Falta el 03
  printFichaViva(profile, 'Caso 2 - Falta un archivo físico');

  // Caso 3: Duplicado en el Excel
  index = await reader.parseIndex(paths.duplicado);
  profile = new ExpedienteDigitalVivo(index, detector);
  profile.reconcilePhysicalFiles(['14.pdf', '15.pdf', '15_bis.pdf']);
  printFichaViva(profile, 'Caso 3 - Consecutivo duplicado en Índice');

  // Caso 4: Salto
  index = await reader.parseIndex(paths.gap);
  profile = new ExpedienteDigitalVivo(index, detector);
  profile.reconcilePhysicalFiles(['18.pdf', '20.pdf']);
  printFichaViva(profile, 'Caso 4 - Salto de Consecutivo');

  // Caso 5: Encabezados raros
  index = await reader.parseIndex(paths.raro);
  profile = new ExpedienteDigitalVivo(index, detector);
  profile.reconcilePhysicalFiles(['01.pdf', '02.pdf']);
  printFichaViva(profile, 'Caso 5 - Encabezados alternativos');

  // Caso 6: Daño humano y Huérfano engañoso
  index = await reader.parseIndex(paths.humano);
  profile = new ExpedienteDigitalVivo(index, detector);
  // Pasamos un archivo huérfano legítimo y una "copia"
  profile.reconcilePhysicalFiles(['01.pdf', '02.pdf', 'Memorial_nuevo.pdf', 'Auto(1).pdf']);
  printFichaViva(profile, 'Caso 6 - Daño humano y archivo huérfano engañoso');
}

runTests().catch(console.error);

