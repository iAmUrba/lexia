import { RuleDefinition } from './core.js';

export const CASE_NUMBER_RULES: RuleDefinition[] = [
  {
    id: 'case-number-cui',
    description: 'Código Único de Identificación (CUI) o Radicado Interno de 21 dígitos',
    regex: /\b([0-9]{21})\b/g,
    confidence: { score: 90, origin: 'Deterministic' }
  },
  {
    id: 'case-number-short',
    description: 'Radicado corto interno (ej. 2024-00123)',
    regex: /\b(20[0-2][0-9])-(0[0-9]{4}|[0-9]{5})\b/g,
    confidence: { score: 85, origin: 'Deterministic' }
  }
];
