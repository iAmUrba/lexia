import { ParticipantMention } from '@lexia/domain';

export class MentionNormalizer {
  private static readonly PREFIXES_TO_REMOVE = [
    /^el\s+/i,
    /^la\s+/i,
    /^los\s+/i,
    /^las\s+/i,
    /^un\s+/i,
    /^una\s+/i,
    /^sr\.?\s+/i,
    /^sra\.?\s+/i,
    /^señor\s+/i,
    /^señora\s+/i,
    /^dr\.?\s+/i,
    /^dra\.?\s+/i,
    /^doctor\s+/i,
    /^doctora\s+/i,
    /^juez\s+/i,
    /^fiscal\s+/i,
    /^defensor\s+/i,
    /^abogado\s+/i,
    /^abogada\s+/i,
    /^magistrado\s+/i,
    /^magistrada\s+/i
  ];

  /**
   * Genera un nuevo ParticipantMention con el texto normalizado, sin mutar el original.
   */
  public normalize(mention: ParticipantMention): ParticipantMention {
    let cleanText = mention.rawText.trim();

    // Remover prefijos comunes y honoríficos iterativamente hasta que no queden
    let hasChanged = true;
    while (hasChanged) {
      hasChanged = false;
      for (const prefix of MentionNormalizer.PREFIXES_TO_REMOVE) {
        if (prefix.test(cleanText)) {
          cleanText = cleanText.replace(prefix, '').trim();
          hasChanged = true;
        }
      }
    }

    // Normalizar a Title Case simplificado
    cleanText = cleanText
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      ...mention,
      normalizedText: cleanText
    };
  }
}
