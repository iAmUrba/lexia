import { RuleDefinition } from './core.js';

export const RADICADO_RULES: RuleDefinition[] = [
  {
    id: 'radicado-colombia-v1',
    description: 'Radicado Ley 906 estándar de 23 dígitos',
    regex: /\b(?:[0-9]{23})\b/g,
    confidence: { score: 100, origin: 'Deterministic' }
  },
  {
    id: 'radicado-colombia-format-v1',
    description: 'Radicado con guiones o espacios',
    regex: /\b([0-9]{5})(?:-|\s)?([0-9]{2})(?:-|\s)?([0-9]{2})(?:-|\s)?([0-9]{3})(?:-|\s)?([0-9]{4})(?:-|\s)?([0-9]{5})(?:-|\s)?([0-9]{2})\b/g,
    confidence: { score: 95, origin: 'Deterministic' }
  }
];
