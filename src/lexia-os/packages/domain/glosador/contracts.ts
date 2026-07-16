/**
 * Representa un archivo PDF recién ingresado (Ej. desde la carpeta JUAN DAVID)
 */
export interface IncomingDocument {
  id: string;
  originalName: string;
  sourcePath: string;
  extractedText?: string;
}

/**
 * Representa una carpeta de expediente existente en el OneDrive.
 */
export interface CaseFolder {
  path: string;
  folderName: string; // ej: 19001600072420210007700
}

/**
 * Representa los datos exactos extraídos del 000IndiceElectronico.xlsm
 */
export interface ElectronicIndexData {
  radicado: string;
  procesado: string;
  demandante: string;
  juzgado: string;
  documentCount: number;
}

/**
 * Resultado de la evaluación de un candidato.
 */
export interface VerificationResult {
  candidate: CaseFolder;
  confidenceScore: number; // 0 a 100
  indexData?: ElectronicIndexData;
  reasons: string[]; // Explicabilidad (XAI)
}

/**
 * Sugerencia de renombramiento y ubicación.
 */
export interface PlacementSuggestion {
  targetSubfolder: string; // ej: 'CuadernoJuzgadoConocimiento'
  suggestedName: string;   // ej: '018SolicitudFiscalia.pdf'
}

/**
 * Un movimiento propuesto. Inmutable.
 */
export interface GlossingAction {
  document: IncomingDocument;
  selectedCase: CaseFolder;
  placement: PlacementSuggestion;
  confidence: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
}

/**
 * 1. Busca carpetas candidatas basándose en heurísticas rápidas (nombre de carpeta).
 */
export interface CandidateFinder {
  findCandidates(document: IncomingDocument): Promise<CaseFolder[]>;
}

/**
 * 2. El Cirujano: Abre el Excel de los candidatos y valida con certeza absoluta.
 */
export interface CaseVerifier {
  verify(candidates: CaseFolder[], document: IncomingDocument): Promise<VerificationResult[]>;
}

/**
 * 3. Analiza la carpeta destino y propone el consecutivo (ej. 018).
 */
export interface NumberingStrategy {
  proposePlacement(caseFolder: CaseFolder, document: IncomingDocument): Promise<PlacementSuggestion>;
}

/**
 * 4. Orquestador del flujo, genera el plan para revisión humana.
 */
export interface GlossingEngine {
  analyze(document: IncomingDocument): Promise<GlossingAction>;
  execute(actions: GlossingAction[]): Promise<void>;
}
