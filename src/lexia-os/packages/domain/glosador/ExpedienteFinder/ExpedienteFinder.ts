import { StorageProvider } from '../StorageProvider/StorageProvider';
import { AnalysisResult } from '../PdfAnalyzer/PdfAnalyzer';

export interface ExpedienteSearchResult {
  expedientePath: string;
  foundBy: 'RADICADO' | 'PROCESADO' | 'CEDULA';
}

export class ExpedienteFinder {
  constructor(private storageProvider: StorageProvider) {}

  /**
   * Busca la carpeta del expediente en base al análisis jerárquico del PDF.
   */
  async findExpediente(analysis: AnalysisResult): Promise<ExpedienteSearchResult | null> {
    
    // 1. Intento por Radicado
    if (analysis.radicado) {
      const results = await this.storageProvider.findExpedienteFolders(analysis.radicado);
      if (results.length === 1) {
        return { expedientePath: results[0], foundBy: 'RADICADO' };
      }
    }

    // 2. Intento por Nombre de Procesado
    if (analysis.procesado) {
      const results = await this.storageProvider.findExpedienteFolders(analysis.procesado);
      if (results.length === 1) {
        return { expedientePath: results[0], foundBy: 'PROCESADO' };
      }
    }

    // 3. Intento por Cédula
    if (analysis.cedula) {
      const results = await this.storageProvider.findExpedienteFolders(analysis.cedula);
      if (results.length === 1) {
        return { expedientePath: results[0], foundBy: 'CEDULA' };
      }
    }

    // Si no encuentra exactamente 1 (ej. hay conflictos o no hay ninguno), retorna null para Revisión Manual.
    return null;
  }
}
