import { Timeline, Participant } from '../index.js';

export type CaseId = string;

/**
 * Identificadores del expediente en el mundo judicial.
 */
export interface CaseIdentifiers {
  readonly radicado?: string;
  readonly nuc?: string;
  readonly interno?: string;
}

/**
 * Representa la relación de un documento anexado al expediente.
 */
export interface CaseDocument {
  readonly documentId: string;
  readonly relation: 'PRINCIPAL' | 'ANEXO' | 'MEMORIAL' | 'OFICIO' | 'DESCONOCIDO';
  readonly addedAt: string; // ISO 8601
  readonly source: string;
}

/**
 * Representa eventos de negocio ocurridos en el expediente.
 */
export interface CaseEvent {
  readonly eventId: string;
  readonly type: 'DocumentAdded' | 'ParticipantMerged' | 'TimelineMerged' | 'CaseCreated' | 'CaseClosed';
  readonly timestamp: string; // ISO 8601
  readonly payload: any;
}

/**
 * El Agregado Principal del sistema (Aggregate Root).
 * Modela el expediente jurídico completo.
 */
export interface Case {
  readonly id: CaseId;
  readonly identifiers: CaseIdentifiers;
  
  // Documentos anexados
  readonly documents: CaseDocument[];
  
  // Participantes consolidados a nivel expediente
  readonly participants: Participant[];
  
  // Línea de tiempo maestra del expediente
  readonly timeline: Timeline;
  
  // Eventos de negocio (Event Sourcing light)
  readonly events: CaseEvent[];
}
