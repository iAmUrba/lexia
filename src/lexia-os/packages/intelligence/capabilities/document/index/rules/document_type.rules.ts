import { RuleDefinition } from './core.js';

export const DOCUMENT_TYPE_RULES: RuleDefinition[] = [
  {
    id: 'doctype-auto-interlocutorio',
    description: 'Auto Interlocutorio',
    regex: /\b(AUTO\s+INTERLOCUTORIO)\b/i,
    confidence: { score: 95, origin: 'Deterministic' }
  },
  {
    id: 'doctype-auto-sustanciacion',
    description: 'Auto de Sustanciación',
    regex: /\b(AUTO\s+DE\s+SUSTANCIACI[OÓ]N)\b/i,
    confidence: { score: 95, origin: 'Deterministic' }
  },
  {
    id: 'doctype-sentencia-condenatoria',
    description: 'Sentencia Condenatoria',
    regex: /\b(SENTENCIA\s+CONDENATORIA)\b/i,
    confidence: { score: 95, origin: 'Deterministic' }
  },
  {
    id: 'doctype-sentencia-absolutoria',
    description: 'Sentencia Absolutoria',
    regex: /\b(SENTENCIA\s+ABSOLUTORIA)\b/i,
    confidence: { score: 95, origin: 'Deterministic' }
  },
  {
    id: 'doctype-oficio',
    description: 'Oficio',
    regex: /\b(OFICIO\s+N[R°O\.]?\s*[0-9]+)\b/i,
    confidence: { score: 90, origin: 'Deterministic' }
  }
];
