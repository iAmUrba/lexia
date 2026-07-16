import * as fs from 'fs';
import * as path from 'path';
import { CaseInspector, CaseInspectionResult } from './inspector.js';
import pdfParse from 'pdf-parse';

export interface SimulationResult {
  pdfName: string;
  pdfPath: string;
  extractedText: string;
  bestMatch: CaseSimulationMatch | null;
  alternatives: CaseSimulationMatch[];
  isAmbigous: boolean;
}

export interface CaseSimulationMatch {
  radicado: string;
  procesado: string;
  juzgado: string;
  casePath: string;
  confidenceScores: {
    radicado: number;
    procesado: number;
    juzgado: number;
    portada: number;
    nombrePDF: number;
    indice: number;
  };
  globalConfidence: number;
  evidence: { field: string; value: string; location: string }[];
  proposedName: string;
  proposedDestination: string;
  action: 'Mover' | 'Revisión Manual';
}

export class GlosadorSimulator {
  private inMemoryIndex: CaseInspectionResult[] = [];
  private inspector = new CaseInspector();

  public async buildIndex(casesRootPath: string) {
    this.inMemoryIndex = [];
    if (!fs.existsSync(casesRootPath)) throw new Error("La ruta de expedientes no existe.");
    
    const items = fs.readdirSync(casesRootPath);
    for (const item of items) {
      const fullPath = path.join(casesRootPath, item);
      if (fs.statSync(fullPath).isDirectory()) {
        try {
          // Lighter inspection or full inspection to get radicado/procesado
          const result = await this.inspector.inspect(fullPath);
          if (result.radicado !== 'DESCONOCIDO' || result.procesado !== 'DESCONOCIDO') {
            (result as any)._originalPath = fullPath;
            this.inMemoryIndex.push(result);
          }
        } catch (e: any) {
          console.error(`Error procesando ${fullPath}: ${e.message}`);
          // Ignorar carpetas que no son expedientes válidos
        }
      }
    }
  }

  public async simulate(inboxPath: string): Promise<SimulationResult[]> {
    if (this.inMemoryIndex.length === 0) {
      throw new Error("El índice maestro está vacío. Debes construirlo primero.");
    }
    
    if (!fs.existsSync(inboxPath)) throw new Error("La bandeja de entrada no existe.");
    
    const results: SimulationResult[] = [];
    const files = fs.readdirSync(inboxPath);
    
    for (const file of files) {
      if (file.toLowerCase().endsWith('.pdf')) {
        const fullPath = path.join(inboxPath, file);
        let extractedText = '';
        
        try {
          const dataBuffer = fs.readFileSync(fullPath);
          const pdfData = await pdfParse(dataBuffer);
          extractedText = pdfData.text.replace(/\s+/g, ' ').trim();
        } catch (e) {
          extractedText = '[Error extrayendo texto del PDF]';
        }
        
        const matches = this.matchCase(file, extractedText);
        
        let bestMatch = null;
        let alternatives: CaseSimulationMatch[] = [];
        let isAmbigous = false;

        if (matches.length > 0) {
          bestMatch = matches[0];
          alternatives = matches.slice(1);
          
          if (bestMatch.globalConfidence < 70) {
            bestMatch.action = 'Revisión Manual';
          }
          
          // Detectar ambigüedad si el segundo mejor match tiene score muy cercano
          if (alternatives.length > 0 && (bestMatch.globalConfidence - alternatives[0].globalConfidence) < 15) {
            isAmbigous = true;
            bestMatch.action = 'Revisión Manual';
          }
        }

        results.push({
          pdfName: file,
          pdfPath: fullPath,
          extractedText: extractedText.substring(0, 200) + '...',
          bestMatch,
          alternatives,
          isAmbigous
        });
      }
    }
    return results;
  }

  private matchCase(pdfName: string, pdfText: string): CaseSimulationMatch[] {
    const textLower = pdfText.toLowerCase();
    const nameLower = pdfName.toLowerCase();
    
    const matches: CaseSimulationMatch[] = [];

    for (const caseData of this.inMemoryIndex) {
      let scoreRadicado = 0;
      let scoreProcesado = 0;
      let scoreJuzgado = 0;
      let scoreNombre = 0;
      let scoreIndice = 100; // Asumimos que el índice existe si está en memoria (se penaliza en global si no)
      let scorePortada = 0;

      const evidence: any[] = [];
      
      const radicadoTokens = caseData.radicado.toLowerCase().split(/[^\w\d]+/);
      const mainRadicado = radicadoTokens[radicadoTokens.length -1] || caseData.radicado.toLowerCase();

      // Buscar Radicado
      if (textLower.includes(mainRadicado) || nameLower.includes(mainRadicado)) {
        scoreRadicado = 100;
        evidence.push({ field: 'Radicado', value: caseData.radicado, location: 'Encontrado en texto/nombre del PDF' });
      } else if (mainRadicado !== 'desconocido') {
         scoreRadicado = 0;
      }

      // Buscar Procesado
      const procesadoTokens = caseData.procesado.toLowerCase().split(' ').filter(t => t.length > 3);
      let foundTokens = 0;
      for (const t of procesadoTokens) {
        if (textLower.includes(t)) foundTokens++;
      }
      if (procesadoTokens.length > 0) {
        scoreProcesado = Math.round((foundTokens / procesadoTokens.length) * 100);
        if (scoreProcesado > 50) {
          evidence.push({ field: 'Procesado', value: caseData.procesado, location: 'Similitud encontrada en texto' });
        }
      }

      // Juzgado (Generalmente los PDF mencionan el juzgado al que van dirigidos)
      if (textLower.includes('juzgado tercero') || textLower.includes('juzgado 03') || textLower.includes('juzgado 3')) {
        scoreJuzgado = 100;
        evidence.push({ field: 'Juzgado', value: 'Juzgado 03', location: 'Mencionado en el cuerpo del PDF' });
      } else {
        scoreJuzgado = 50; // Neutral
      }

      // Nombre del PDF (Heurística: si el nombre tiene algo de relación)
      if (nameLower.includes(mainRadicado) || (procesadoTokens.length > 0 && nameLower.includes(procesadoTokens[0]))) {
        scoreNombre = 100;
      } else {
        scoreNombre = 40;
      }

      // Portada (Simulado: Asumimos que si hay mucho texto coincidente, la portada cuadra)
      scorePortada = Math.round((scoreRadicado + scoreProcesado) / 2);

      // Calcular global
      const globalConfidence = Math.round((scoreRadicado * 0.4) + (scoreProcesado * 0.3) + (scoreJuzgado * 0.1) + (scoreNombre * 0.1) + (scorePortada * 0.1));

      const propNumber = (caseData.lastPhysicalNumber + 1).toString().padStart(3, '0');
      const cleanPdfName = pdfName.replace(/^[\d\s-_]+/, '').trim();
      const proposedName = `${propNumber}${cleanPdfName || 'Documento.pdf'}`;

      if (globalConfidence > 20) {
        matches.push({
          radicado: caseData.radicado,
          procesado: caseData.procesado,
          juzgado: caseData.juzgado,
          casePath: (caseData as any)._originalPath,
          confidenceScores: {
            radicado: scoreRadicado,
            procesado: scoreProcesado,
            juzgado: scoreJuzgado,
            portada: scorePortada,
            nombrePDF: scoreNombre,
            indice: scoreIndice
          },
          globalConfidence,
          evidence,
          proposedName,
          proposedDestination: 'C03Conocimiento',
          action: globalConfidence >= 80 ? 'Mover' : 'Revisión Manual'
        });
      }
    }

    // Sort by confidence DESC
    matches.sort((a, b) => b.globalConfidence - a.globalConfidence);
    return matches;
  }
}
