import { Patterns } from './EvidencePatterns/index.js';

export interface EvidenceItem {
  valor: string;
  pagina: number;
  confianza: number;
}

export interface ExtractedEvidence {
  radicados: EvidenceItem[];
  spoa: EvidenceItem[];
  cui: EvidenceItem[];
  procesados: EvidenceItem[];
  victimas: EvidenceItem[];
  defensores: EvidenceItem[];
  fiscales: EvidenceItem[];
  fechas: EvidenceItem[];
  documentType: string;
  confidence: number;
}

export class EvidenceExtractor {
  extract(text: string): ExtractedEvidence {
    const evidence: ExtractedEvidence = {
      radicados: [],
      spoa: [],
      cui: [],
      procesados: [],
      victimas: [],
      defensores: [],
      fiscales: [],
      fechas: [],
      documentType: 'Desconocido',
      confidence: 0,
    };

    if (!text) return evidence;

    const createItem = (valor: string, conf: number = 1.0): EvidenceItem => ({
      valor,
      pagina: 1,
      confianza: conf
    });
    
    const addUnique = (list: EvidenceItem[], valor: string, conf: number = 1.0) => {
        if (!list.some(e => e.valor === valor)) {
            list.push(createItem(valor, conf));
        }
    };

    const radMatches = text.match(Patterns.radicado);
    if (radMatches) {
        radMatches.forEach(r => addUnique(evidence.radicados, r, 1.0));
    }

    const spoaRegex = /\b\d{21}\b/g;
    const spoaMatches = text.match(spoaRegex);
    if (spoaMatches) {
        spoaMatches.forEach(s => {
            if (!evidence.radicados.some(r => r.valor === s)) {
                addUnique(evidence.spoa, s, 0.8);
            }
        });
    }
    
    let match;
    while ((match = Patterns.ni.exec(text)) !== null) {
      const explicitSpoa = match[1];
      addUnique(evidence.spoa, explicitSpoa, 1.0);
      // If it was added to radicados because of the generic 21-digit regex, remove it:
      evidence.radicados = evidence.radicados.filter(r => r.valor !== explicitSpoa);
    }
    Patterns.ni.lastIndex = 0; // Reset stateful regex

    while ((match = Patterns.cui.exec(text)) !== null) {
      addUnique(evidence.cui, match[1].trim(), 1.0);
    }
    Patterns.cui.lastIndex = 0;

    while ((match = Patterns.procesado.exec(text)) !== null) {
      addUnique(evidence.procesados, match[1].trim(), 0.99);
    }
    Patterns.procesado.lastIndex = 0;

    while ((match = Patterns.victima.exec(text)) !== null) {
      addUnique(evidence.victimas, match[1].trim(), 0.99);
    }
    Patterns.victima.lastIndex = 0;
    
    while ((match = Patterns.defensor.exec(text)) !== null) {
      addUnique(evidence.defensores, match[1].trim(), 0.99);
    }
    Patterns.defensor.lastIndex = 0;

    while ((match = Patterns.fiscal.exec(text)) !== null) {
      addUnique(evidence.fiscales, match[1].trim(), 0.99);
    }
    Patterns.fiscal.lastIndex = 0;

    const fechaMatches = text.match(Patterns.fecha);
    if (fechaMatches) {
        fechaMatches.forEach(f => addUnique(evidence.fechas, f, 1.0));
    }

    const docMatch = text.match(Patterns.documentType);
    if (docMatch) evidence.documentType = docMatch[1].toUpperCase();

    let score = 0;
    if (evidence.radicados.length > 0) score += 40;
    if (evidence.spoa.length > 0) score += 20;
    if (evidence.procesados.length > 0) score += 20;
    if (evidence.documentType !== 'Desconocido') score += 10;
    
    evidence.confidence = Math.min(score, 100);

    return evidence;
  }
}
