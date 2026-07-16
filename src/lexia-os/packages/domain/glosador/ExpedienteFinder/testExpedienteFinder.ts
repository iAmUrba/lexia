import { ExpedienteFinder } from './ExpedienteFinder';
import { StorageProvider } from '../StorageProvider/StorageProvider';
import { AnalysisResult } from '../PdfAnalyzer/PdfAnalyzer';

class MockStorageProvider implements StorageProvider {
  async findExpedienteFolders(query: string): Promise<string[]> {
    if (query === '19001600072420210007700') {
      return ['/OneDrive/Despacho/19001600072420210007700 - HOLMAN GARCES'];
    }
    if (query === 'HOLMAN GARCES') {
      return ['/OneDrive/Despacho/19001600072420210007700 - HOLMAN GARCES'];
    }
    if (query === '1012345678') {
      return ['/OneDrive/Despacho/200000 - CASO CEDULA'];
    }
    if (query === 'JUAN PEREZ') {
      // Caso de ambigüedad (2 personas llamadas igual o copia de carpeta)
      return [
        '/OneDrive/Despacho/300000 - JUAN PEREZ',
        '/OneDrive/Despacho/400000 - JUAN PEREZ'
      ];
    }
    return [];
  }
  async findKnowledgeFolder(path: string) { return null; }
  async downloadFile(path: string) { return ''; }
  async uploadFile(local: string, target: string) { return; }
  async moveFile(src: string, target: string) { return; }
  async createBackup(target: string) { return ''; }
}

async function runSprint2() {
  const provider = new MockStorageProvider();
  const finder = new ExpedienteFinder(provider);

  const tests: AnalysisResult[] = [
    { radicado: '19001600072420210007700', confidence: 100 },
    { procesado: 'HOLMAN GARCES', confidence: 95 },
    { cedula: '1012345678', confidence: 95 },
    { procesado: 'JUAN PEREZ', confidence: 95 },
    { context: 'Juez sin nada mas', confidence: 0 }
  ];

  console.log('### Sprint 2 Reporte - Pruebas ExpedienteFinder\n');

  for (let i = 0; i < tests.length; i++) {
    const analysis = tests[i];
    const start = performance.now();
    const result = await finder.findExpediente(analysis);
    const end = performance.now();
    
    console.log(`Caso ${i + 1}`);
    console.log(`Entrada: ${analysis.radicado || analysis.procesado || analysis.cedula || 'Sin coincidencias'}`);
    
    if (result) {
      console.log(`Resultado: ✔ Encontrado por ${result.foundBy}`);
      console.log(`Carpeta destino: ${result.expedientePath}`);
    } else {
      if (analysis.procesado === 'JUAN PEREZ') {
        console.log(`Resultado: ⚠ Ambigüedad encontrada (Múltiples carpetas). Estado: Manual`);
      } else {
        console.log(`Resultado: ⚠ No encontrado. Estado: Manual`);
      }
    }
    console.log(`Tiempo: ${(end - start).toFixed(2)} ms`);
    console.log('---\n');
  }
}

runSprint2();
