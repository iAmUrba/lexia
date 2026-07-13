import { RuleDefinition } from './core.js';

export const PAGE_RULES: RuleDefinition[] = [
  {
    id: 'page-number-colombia',
    description: 'Página X de Y',
    regex: /\b(?:Página|Pág\.?)\s+(\d+)\s+(?:de|/)\s+(\d+)\b/gi,
    confidence: { score: 90, origin: 'Deterministic' }
  }
];
