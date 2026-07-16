export interface InputDocument {
  id: string;
  sourceType: 'FILESYSTEM' | 'EMAIL' | 'WHATSAPP' | 'SCANNER';
  originalName: string;
  sourcePath: string;
  buffer?: Buffer;
  extractedText?: string;
}

export interface AnalysisResult {
  radicado?: string;
  procesado?: string;
  cedula?: string;
  context?: string;
  confidence: number;
}

export class PdfAnalyzer {
  
  async analyze(document: InputDocument): Promise<AnalysisResult> {
    const text = document.extractedText || '';
    const result: AnalysisResult = { confidence: 0 };
    
    // Nivel 1: Radicado (100% confidence) - 21 to 23 digits
    const radicadoMatch = text.match(/\b\d{21,23}\b/);
    if (radicadoMatch) {
      result.radicado = radicadoMatch[0];
      result.confidence = 100;
      return result;
    }

    // Nivel 2: Nombre Procesado (95% confidence)
    const procesadoMatch = text.match(/Procesado:\s*([A-ZÑÁÉÍÓÚ\s]+)/i);
    if (procesadoMatch) {
      result.procesado = procesadoMatch[1].trim();
      result.confidence = 95;
      return result;
    }

    // Nivel 3: Cédula (95% confidence)
    const cedulaMatch = text.match(/(?:CC|C\.C\.|Cédula|C.C|CC:)\s*(\d{6,10})/i);
    if (cedulaMatch) {
      result.cedula = cedulaMatch[1];
      result.confidence = 95;
      return result;
    }

    return result;
  }
}
