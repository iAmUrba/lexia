export interface ExtractedEvidence {
  radicados: string[];
  procesados: string[];
  cedulas: string[];
  spoa: string[];
  cui: string[];
  fechas: string[];
  horas: string[];
  fiscalias: string[];
}

export class EvidenceExtractor {
  extract(text: string): ExtractedEvidence {
    const evidence: ExtractedEvidence = {
      radicados: [],
      procesados: [],
      cedulas: [],
      spoa: [],
      cui: [],
      fechas: [],
      horas: [],
      fiscalias: []
    };

    if (!text) return evidence;

    // Radicados completos (21 a 23 dígitos)
    const radicadoRegex = /\b\d{21,23}\b/g;
    const radMatches = text.match(radicadoRegex);
    if (radMatches) evidence.radicados = [...new Set(radMatches)];

    // SPOA (Noticia Criminal)
    const spoaRegex = /\b\d{21}\b/g; // A veces el SPOA es de 21 dígitos
    // Para simplificar MVP, si dice SPOA o N.I. lo extraemos.
    const niRegex = /(?:SPOA|N\.?I\.?)\s*:?\s*(\d+)/gi;
    let match;
    while ((match = niRegex.exec(text)) !== null) {
      evidence.spoa.push(match[1]);
    }

    // Nombres procesado
    const procesadoRegex = /(?:Procesado|Acusado|Contra|Indiciado|Imputado|Sindicado)\s*:\s*([A-ZÑÁÉÍÓÚ\s]{4,50})/gi;
    while ((match = procesadoRegex.exec(text)) !== null) {
      evidence.procesados.push(match[1].trim());
    }

    // Cédulas
    const cedulaRegex = /(?:CC|C\.C\.|Cédula|C.C|CC:)\s*(\d{6,10})/gi;
    while ((match = cedulaRegex.exec(text)) !== null) {
      evidence.cedulas.push(match[1]);
    }

    // Fechas (dd/mm/yyyy o dd de mes de yyyy)
    const fechaRegex = /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/g;
    const fechaMatches = text.match(fechaRegex);
    if (fechaMatches) evidence.fechas = [...new Set(fechaMatches)];

    // Horas (hh:mm)
    const horaRegex = /\b([0-1]?[0-9]|2[0-3]):[0-5][0-9]\b/g;
    const horaMatches = text.match(horaRegex);
    if (horaMatches) evidence.horas = [...new Set(horaMatches)];

    return evidence;
  }
}
