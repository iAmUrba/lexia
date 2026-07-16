import { StorageProvider } from '../StorageProvider/StorageProvider';
import { IndiceStatus } from '../IndiceElectronicoReader/IndiceElectronicoReader';

export interface ConsecutiveResult {
  excelConsecutive: number;
  physicalConsecutive: number;
  proposedConsecutive: number;
  hasInconsistency: boolean;
  status: 'READY' | 'MANUAL_REVIEW';
}

export class ConsecutiveCalculator {
  constructor(private storageProvider: StorageProvider) {}

  async calculate(knowledgeFolderPath: string, indiceStatus: IndiceStatus): Promise<ConsecutiveResult> {
    
    // Si el Excel de por sí no es válido, se aborta y pide revisión manual.
    if (!indiceStatus.isValid) {
      return {
        excelConsecutive: 0,
        physicalConsecutive: 0,
        proposedConsecutive: 0,
        hasInconsistency: true,
        status: 'MANUAL_REVIEW'
      };
    }

    // Listamos los archivos reales de la carpeta
    const files = await this.storageProvider.listFilesInFolder(knowledgeFolderPath);
    
    let maxPhysicalConsecutive = 0;
    const foundConsecutives = new Set<number>();
    let hasDuplicate = false;
    
    for (const fileName of files) {
      // Usualmente los documentos empiezan por el consecutivo, ej: 018Constancia.pdf, 117_Acta.pdf
      const match = fileName.match(/^0*(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        
        // Regla: No asumir duplicados físicos
        if (foundConsecutives.has(num)) {
          hasDuplicate = true;
        }
        foundConsecutives.add(num);

        if (num > maxPhysicalConsecutive) {
          maxPhysicalConsecutive = num;
        }
      }
    }

    // Reglas de inconsistencia:
    // 1. Duplicados físicos de un mismo consecutivo.
    // 2. Excel mayor que físico (ej. Excel 018, pero carpeta 017).
    // 3. Físico mayor que Excel (ej. Carpeta 018, Excel 017).
    const hasInconsistency = 
      hasDuplicate || 
      indiceStatus.lastConsecutive !== maxPhysicalConsecutive;
    
    return {
      excelConsecutive: indiceStatus.lastConsecutive,
      physicalConsecutive: maxPhysicalConsecutive,
      proposedConsecutive: Math.max(indiceStatus.lastConsecutive, maxPhysicalConsecutive) + 1,
      hasInconsistency,
      status: hasInconsistency ? 'MANUAL_REVIEW' : 'READY'
    };
  }
}
