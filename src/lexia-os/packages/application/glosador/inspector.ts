import * as fs from 'fs';
import * as path from 'path';
import xlsx from 'xlsx';

export interface InspectionStats {
  pdfCount: number;
  wordCount: number;
  excelCount: number;
  folderCount: number;
  totalSizeBytes: number;
}

export interface InspectionFindings {
  warnings: string[];
  risks: string[];
}

export interface Evidence {
  field: string;
  value: string;
  source: string;
  location: string;
}

export interface CaseInspectionResult {
  radicado: string;
  procesado: string;
  juzgado: string;
  expectedJuzgado: string;
  healthScore: number;
  healthStatus: '🟢' | '🟡' | '🔴';
  stats: InspectionStats;
  findings: InspectionFindings;
  evidence: Evidence[];
  excelFound: boolean;
  knowledgeFolderFound: boolean;
  physicalDocsCount: number;
  excelDocsCount: number;
  lastExcelNumber: number;
  lastPhysicalNumber: number;
  missingPhysical: number[];
  unindexedPhysical: number[];
}

export class CaseInspector {
  private expectedJuzgado: string;

  constructor(expectedJuzgado: string = 'Juzgado Tercero Penal Del Circuito Especializado') {
    this.expectedJuzgado = expectedJuzgado.toLowerCase().trim();
  }

  public async inspect(caseFolderPath: string): Promise<CaseInspectionResult> {
    const stats: InspectionStats = { pdfCount: 0, wordCount: 0, excelCount: 0, folderCount: 0, totalSizeBytes: 0 };
    const findings: InspectionFindings = { warnings: [], risks: [] };
    let healthScore = 100;
    
    let radicado = 'DESCONOCIDO';
    let procesado = 'DESCONOCIDO';
    let juzgado = 'DESCONOCIDO';
    let excelFound = false;
    let knowledgeFolderFound = false;
    let excelDocs: { order: number, name: string }[] = [];
    let physicalNumbers: number[] = [];
    
    const evidence: Evidence[] = [];
    
    // 1. Estadísticas básicas y búsqueda de carpetas y Excel
    if (!fs.existsSync(caseFolderPath)) {
      throw new Error(`La carpeta ${caseFolderPath} no existe.`);
    }

    const { stats: dirStats, excelPath, knowledgeFolder, zeroByteFiles } = this.traverseDir(caseFolderPath);
    stats.pdfCount = dirStats.pdfCount;
    stats.wordCount = dirStats.wordCount;
    stats.excelCount = dirStats.excelCount;
    stats.folderCount = dirStats.folderCount;
    stats.totalSizeBytes = dirStats.totalSizeBytes;

    if (zeroByteFiles.length > 0) {
      findings.risks.push(`🔴 Riesgo Crítico: Se encontraron ${zeroByteFiles.length} archivo(s) vacío(s) (0 bytes) que podrían estar dañados: ${zeroByteFiles.slice(0, 3).join(', ')}${zeroByteFiles.length > 3 ? '...' : ''}`);
      healthScore -= 50;
    }

    // 2. Analizar Excel si se encontró
    if (excelPath) {
      excelFound = true;
      const excelName = path.basename(excelPath);
      try {
        const wb = xlsx.readFile(excelPath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json<any>(ws, { header: 1, defval: '' });
        
        juzgado = String(data[2]?.[1] || 'DESCONOCIDO').trim();
        evidence.push({ field: 'Juzgado', value: juzgado, source: excelName, location: 'Fila 3, Columna B' });
        
        radicado = String(data[4]?.[1] || 'DESCONOCIDO').trim();
        evidence.push({ field: 'Radicado', value: radicado, source: excelName, location: 'Fila 5, Columna B' });
        
        procesado = String(data[5]?.[1] || 'DESCONOCIDO').trim();
        evidence.push({ field: 'Procesado', value: procesado, source: excelName, location: 'Fila 6, Columna B' });

        // Validar Juzgado
        if (juzgado.toLowerCase() !== this.expectedJuzgado) {
          findings.risks.push(`🔴 CREADO POR OTRO DESPACHO: ${juzgado}. Configurado para: ${this.expectedJuzgado}`);
          healthScore -= 30;
        }

        // Extraer documentos del índice (empieza en la fila 9 índice 8)
        let lastDocRow = -1;
        for (let i = 9; i < data.length; i++) {
          const row = data[i];
          if (row && row[0]) {
            const docName = String(row[0]);
            const order = parseInt(row[3]);
            if (!isNaN(order)) {
              excelDocs.push({ order, name: docName });
              lastDocRow = i + 1;
            }
          }
        }
        
        if (excelDocs.length > 0) {
           evidence.push({ field: 'Último Documento Indexado', value: excelDocs[excelDocs.length - 1].order.toString(), source: excelName, location: `Fila ${lastDocRow}, Columna D` });
        }
      } catch (e: any) {
        findings.risks.push(`🔴 Riesgo: El archivo Excel está corrupto o protegido con contraseña. Ábrelo manualmente y vuelve a intentarlo. (${e.message})`);
        healthScore -= 40;
      }
    } else {
      findings.risks.push(`🔴 No se encontró el índice electrónico en la carpeta.`);
      healthScore -= 40;
    }

    // 3. Analizar carpeta de Conocimiento
    if (knowledgeFolder) {
      knowledgeFolderFound = true;
      const files = fs.readdirSync(knowledgeFolder);
      for (const file of files) {
        const match = file.match(/^(\d{3})/);
        if (match) {
          physicalNumbers.push(parseInt(match[1]));
        }
      }
    } else {
      findings.warnings.push(`⚠️ No se encontró la carpeta 'Conocimiento' típica (C02/C03).`);
      healthScore -= 10;
    }

    // 4. Cruzar Realidad (Carpeta) vs Jurídica (Excel)
    const excelNumbers = excelDocs.map(d => d.order);
    const lastExcelNumber = excelNumbers.length > 0 ? Math.max(...excelNumbers) : 0;
    const lastPhysicalNumber = physicalNumbers.length > 0 ? Math.max(...physicalNumbers) : 0;

    const missingPhysical = excelNumbers.filter(n => !physicalNumbers.includes(n));
    const unindexedPhysical = physicalNumbers.filter(n => !excelNumbers.includes(n));

    if (lastExcelNumber !== lastPhysicalNumber) {
      findings.warnings.push(`⚠️ Inconsistencia de tope: Excel termina en ${lastExcelNumber.toString().padStart(3, '0')}, pero Carpeta en ${lastPhysicalNumber.toString().padStart(3, '0')}.`);
      findings.risks.push(`🔴 El Excel no coincide con la carpeta física. No automatizar este expediente.`);
      healthScore -= 20;
    }

    if (missingPhysical.length > 0) {
      findings.warnings.push(`⚠️ Faltan ${missingPhysical.length} documento(s) físico(s) reportado(s) en el Excel: ${missingPhysical.join(', ')}`);
      healthScore -= missingPhysical.length * 5;
    }

    if (unindexedPhysical.length > 0) {
      findings.warnings.push(`⚠️ Existen ${unindexedPhysical.length} documento(s) físico(s) NO registrados en el Excel: ${unindexedPhysical.join(', ')}`);
      healthScore -= unindexedPhysical.length * 5;
    }

    if (healthScore < 0) healthScore = 0;

    let healthStatus: '🟢' | '🟡' | '🔴' = '🟢';
    if (healthScore < 70) healthStatus = '🟡';
    if (healthScore < 40 || findings.risks.length > 0) healthStatus = '🔴';

    return {
      radicado,
      procesado,
      juzgado,
      expectedJuzgado: this.expectedJuzgado,
      healthScore,
      healthStatus,
      stats,
      findings,
      evidence,
      excelFound,
      knowledgeFolderFound,
      physicalDocsCount: physicalNumbers.length,
      excelDocsCount: excelNumbers.length,
      lastExcelNumber,
      lastPhysicalNumber,
      missingPhysical,
      unindexedPhysical
    };
  }

  private traverseDir(dir: string) {
    let stats = { pdfCount: 0, wordCount: 0, excelCount: 0, folderCount: 0, totalSizeBytes: 0 };
    let excelPath: string | null = null;
    let knowledgeFolder: string | null = null;

    let zeroByteFiles: string[] = [];

    const walk = (currentPath: string) => {
      const items = fs.readdirSync(currentPath);
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        stats.totalSizeBytes += stat.size;

        if (stat.isDirectory()) {
          stats.folderCount++;
          if (/C\d{2}Conocimiento/i.test(item) || /Cuaderno.*Conocimiento/i.test(item)) {
            knowledgeFolder = fullPath;
          }
          walk(fullPath);
        } else {
          if (stat.size === 0) zeroByteFiles.push(item);
          const ext = path.extname(item).toLowerCase();
          if (ext === '.pdf') stats.pdfCount++;
          else if (ext === '.docx' || ext === '.doc') stats.wordCount++;
          else if (ext === '.xlsx' || ext === '.xlsm') {
            stats.excelCount++;
            if (/(indice|índice|inventario)/i.test(item)) {
              excelPath = fullPath;
            }
          }
        }
      }
    };

    walk(dir);
    return { stats, excelPath, knowledgeFolder, zeroByteFiles };
  }
}
