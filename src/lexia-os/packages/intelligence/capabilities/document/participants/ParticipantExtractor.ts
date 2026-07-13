import { ParticipantMention } from '@lexia/domain';
import { DetectionRule } from './rules/DetectionRule.js';

export class ParticipantExtractor {
  private readonly rules: DetectionRule[];
  private readonly extractorName = 'ParticipantExtractor';

  constructor(rules: DetectionRule[]) {
    // Ordenar reglas por prioridad de mayor a menor
    this.rules = [...rules].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Ejecuta todas las reglas sobre el texto proporcionado sin deduplicar.
   * La deduplicación y el Entity Linking pertenecen a la Fase 8.3.
   */
  extract(text: string): ParticipantMention[] {
    const allMentions: ParticipantMention[] = [];

    for (const rule of this.rules) {
      const mentions = rule.detect(text, this.extractorName);
      allMentions.push(...mentions);
    }

    // Ordenar por aparición en el documento
    return allMentions.sort((a, b) => a.evidence.offset - b.evidence.offset);
  }
}
