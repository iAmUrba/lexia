import { RuleDefinition } from './core.js';

export const DATE_RULES: RuleDefinition[] = [
  {
    id: 'date-colombia-dd-mm-yyyy',
    description: 'Fecha en formato DD/MM/YYYY o DD-MM-YYYY',
    regex: /\b([0-3][0-9])[\/\-]([0-1][0-9])[\/\-]([1-2][0-9]{3})\b/g,
    confidence: { score: 95, origin: 'Deterministic' }
  },
  {
    id: 'date-colombia-long',
    description: 'Fecha larga ej. 15 de julio de 2025',
    regex: /\b([1-3]?[0-9])\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+([1-2][0-9]{3})\b/gi,
    confidence: { score: 90, origin: 'Deterministic' }
  }
];
