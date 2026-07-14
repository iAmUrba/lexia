import { Case } from '../case/models.js';
import { EvidenceReference } from '../xai/contracts.js';

export interface DocumentSection {
  readonly id: string;
  readonly title?: string;
  readonly content: string;
}

/**
 * Modelo semántico del documento que se quiere generar.
 * Agnóstico al formato (DOCX, PDF, HTML).
 */
export interface DocumentModel {
  readonly title: string;
  readonly fields: Record<string, unknown>;
  readonly sections: DocumentSection[];
  readonly evidence: EvidenceReference[];
}

/**
 * Define cómo un tipo de documento específico (ej. Constancia de aplazamiento)
 * se construye a partir del Expediente.
 */
export interface DocumentProjector {
  project(caso: Case, params?: Record<string, any>): DocumentModel;
}

/**
 * Metadatos sobre un tipo de documento que el sistema puede generar.
 */
export interface DocumentDefinition {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly projector: DocumentProjector;
}

/**
 * Contrato base para un motor que toma un DocumentModel y lo plasma
 * en un formato físico/digital específico (DOCX, PDF, etc.).
 */
export interface DocumentRenderer<TOutput = Buffer | string> {
  render(model: DocumentModel, templatePath?: string): Promise<TOutput>;
}
