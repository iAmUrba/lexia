import { Document, DocumentIndexAsset } from '@lexia/domain';
import { CaseSummaryView } from '../contracts/CaseSummaryView.js';
import { CaseHeaderProjector } from './CaseHeaderProjector.js';

export class CaseSummaryProjector {
  constructor(private headerProjector: CaseHeaderProjector) {}

  project(document: Document): CaseSummaryView {
    const header = this.headerProjector.project(document);
    const indexAsset = document.assets.latest<DocumentIndexAsset>('DocumentIndex');
    
    // Extraer personas de manera preliminar
    const people = indexAsset?.people?.map(p => p.name) || [];
    
    // Extraer warnings a partir de las ejecuciones o assets (para V1 usaremos los de la calidad si existen o los state warnings)
    // Pero lo más limpio por ahora es obtener los del state
    // Para no acoplarnos al Evaluator aquí, usamos executions si están disponibles
    let warnings: string[] = [];
    if (document.executions) {
      warnings = document.executions.flatMap(e => e.warnings);
    }

    return {
      header,
      people,
      timeline: document.timeline.operations,
      warnings
    };
  }
}
