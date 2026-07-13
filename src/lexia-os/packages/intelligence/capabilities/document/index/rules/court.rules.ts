import { RuleDefinition } from './core.js';

export const COURT_RULES: RuleDefinition[] = [
  {
    id: 'court-colombia-juzgado',
    description: 'Juzgado de conocimiento genérico',
    regex: /(JUZGADO\s+(?:[A-ZÁÉÍÓÚÑ]+\s+)+(?:PENAL|CIVIL|LABORAL|DE FAMILIA|PROMISCUO)(?:\s+DEL CIRCUITO|\s+MUNICIPAL)?\s+DE\s+[A-ZÁÉÍÓÚÑ]+)/gi,
    confidence: { score: 85, origin: 'Deterministic' }
  }
];
