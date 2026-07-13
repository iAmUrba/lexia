import { ConfidenceScore } from '../../../foundation/contracts/index.js';
import { AssetType, DocumentAsset, FieldEvidence } from '../contracts.js';

/**
 * Representa la definición de un rol dentro del ecosistema judicial.
 * Permite extensibilidad sin usar enums rígidos.
 */
export interface RoleDefinition {
  readonly id: string; // ej. 'fiscal', 'juez', 'apoderado'
  readonly displayName: string;
  readonly category: 'judicial' | 'ministerio_publico' | 'partes' | 'terceros' | 'otro';
}

export type DetectionKind = 'ROLE_PREFIX' | 'HONORIFIC' | 'ENTITY_NAME' | 'SIGNATURE' | 'PATTERN' | 'UNKNOWN';

/**
 * Representa una mención explícita encontrada en el texto del documento.
 */
export interface ParticipantMention {
  readonly id: string;
  readonly rawText: string;
  readonly normalizedText?: string;
  readonly kind: 'PERSON' | 'ORGANIZATION' | 'UNKNOWN';
  readonly detectionKind: DetectionKind;
  readonly evidence: FieldEvidence;
}

/**
 * Representa a la entidad consolidada en la realidad, agrupada a partir de menciones.
 * No contiene información sobre el rol, ya que los roles son contextuales.
 */
export interface Participant {
  readonly id: string;
  readonly kind: 'PERSON' | 'ORGANIZATION';
  readonly displayName: string;
  readonly identifiers?: string[]; // ej. Cédulas, NITs
}

/**
 * Representa la asignación de un rol a un participante en un contexto específico (un documento o expediente).
 */
export interface ParticipantRoleAssignment {
  readonly participantId: string;
  readonly roleId: string;
  readonly confidence: ConfidenceScore;
  readonly evidence: FieldEvidence;
}

/**
 * Asset producido por el extractor inicial (Fase 8.2) que solo detecta menciones en el texto bruto.
 */
export interface ParticipantMentionsAsset extends DocumentAsset {
  readonly assetType: 'ParticipantMentions'; // Requiere extender AssetType
  readonly mentions: ParticipantMention[];
}

/**
 * Asset producido por el Entity Linker (Fase 8.3) que consolida las menciones en participantes reales y asigna roles.
 */
export interface ParticipantsAsset extends DocumentAsset {
  readonly assetType: 'Participants'; // Requiere extender AssetType
  readonly roles: RoleDefinition[];
  readonly participants: Participant[];
  readonly assignments: ParticipantRoleAssignment[];
}
