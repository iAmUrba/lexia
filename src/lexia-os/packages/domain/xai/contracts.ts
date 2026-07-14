/**
 * Representa una referencia directa a una evidencia en el sistema.
 * Es la base del módulo de Explicabilidad (XAI). Todo dato inferido
 * por el sistema debe poder trazar su origen hacia una de estas referencias.
 */
export interface EvidenceReference {
  readonly evidenceId: string;
  readonly type: 'TEXT_OFFSET' | 'DOCUMENT_METADATA' | 'EXTERNAL_API' | 'HEURISTIC_RULE';
  readonly sourceDocumentId?: string;
  readonly description: string;
  readonly confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'ABSOLUTE';
}

/**
 * Contrato base para cualquier objeto (Asset, Mention, Participant) 
 * que soporte la explicabilidad de sus decisiones.
 */
export interface Explainable {
  readonly explainability: EvidenceReference[];
}
