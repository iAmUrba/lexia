import { ElectronicIndex, DocumentEntry } from './ElectronicIndex.js';
import { AnomalyDetector, Anomaly } from './AnomalyDetector.js';

export type TrustStatus = 'CONSISTENTE' | 'INCONSISTENTE' | 'DESCONOCIDO';

export class ExpedienteDigitalVivo {
  public radicado: string;
  public procesado: string;
  public despacho: string;
  public totalDocumentos: number = 0;
  public totalPaginas: number = 0;
  public ultimoConsecutivo: number = 0;
  public ultimaActuacion: string = "Ninguna";
  public anomalias: Anomaly[] = [];
  public trustStatus: TrustStatus = 'DESCONOCIDO';

  constructor(
    public readonly index: ElectronicIndex, 
    private detector: AnomalyDetector
  ) {
    this.radicado = index.metadata.radicado;
    this.procesado = index.metadata.procesado;
    this.despacho = index.metadata.despacho;
    this.calculateStats();
  }

  private calculateStats() {
    this.totalDocumentos = this.index.documents.length;
    
    if (this.totalDocumentos > 0) {
      // Asumimos que están ordenados por consecutivo
      const lastDoc = this.index.documents[this.totalDocumentos - 1];
      this.ultimoConsecutivo = lastDoc.consecutivo;
      this.ultimaActuacion = lastDoc.nombre;
      
      this.totalPaginas = this.index.documents.reduce((acc, doc) => acc + doc.paginas, 0);
    }
  }

  // Permite cruzar los archivos encontrados en Microsoft Graph contra este índice
  public reconcilePhysicalFiles(physicalFileNames: string[]) {
    // 1. Marcamos cuáles existen
    for (const doc of this.index.documents) {
      // Heurística simple: buscar si el nombre del archivo incluye el consecutivo. En el futuro puede ser más robusto.
      const match = physicalFileNames.find(f => f.includes(`0${doc.consecutivo}`) || f.includes(doc.consecutivo.toString()));
      if (match) {
        doc.existeFisicamente = true;
        doc.nombreArchivo = match;
      } else {
        doc.existeFisicamente = false;
      }
    }

    // 2. Corremos el motor de anomalías
    this.anomalias = this.detector.scan(this.index, physicalFileNames);

    // 3. Calculamos estado de confianza general
    const hasCritical = this.anomalias.some(a => a.severity === 'CRITICAL');
    const hasWarning = this.anomalias.some(a => a.severity === 'WARNING');
    if (hasCritical || hasWarning) {
      this.trustStatus = 'INCONSISTENTE';
    } else {
      this.trustStatus = 'CONSISTENTE';
    }
  }

  public getNextConsecutive(): number {
    return this.ultimoConsecutivo + 1;
  }
}
