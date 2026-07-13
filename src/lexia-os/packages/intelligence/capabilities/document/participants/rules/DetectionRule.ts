import { ParticipantMention } from '@lexia/domain';

/**
 * Contrato base para cualquier regla de detección de participantes.
 * Permite añadir extractores como plugins sin modificar el motor principal.
 */
export interface DetectionRule {
  readonly id: string;
  readonly priority: number;
  
  /**
   * Detecta menciones en un texto crudo.
   * @param text Texto completo del documento (o sección).
   * @param extractorName Nombre del extractor orquestador para la evidencia.
   * @returns Menciones detectadas con su FieldEvidence completa.
   */
  detect(text: string, extractorName: string): ParticipantMention[];
}
