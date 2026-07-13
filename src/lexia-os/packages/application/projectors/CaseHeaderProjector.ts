import { Document, DocumentIndexAsset, ExtractionQualityAsset, DocumentStateEvaluator } from '@lexia/domain';
import { CaseHeaderView } from '../contracts/index.js';

export class CaseHeaderProjector {
  private evaluator = new DocumentStateEvaluator();

  project(document: Document): CaseHeaderView {
    const index = document.assets.latest<DocumentIndexAsset>('DocumentIndex');
    const quality = document.assets.latest<ExtractionQualityAsset>('ExtractionQuality');
    const state = this.evaluator.evaluate(document);

    // Determine current status
    let estado: CaseHeaderView['estado'] = 'READY';
    if (state.missingCapabilities.includes('NEEDS_OCR')) {
      estado = 'NEEDS_OCR';
    } else if (state.missingCapabilities.length > 0) {
      estado = 'PROCESSING';
    }

    // Determine radicado
    let radicado: string | undefined;
    if (index?.primaryIdentifier) {
      radicado = index.primaryIdentifier.value;
    } else if (index?.identifiers && index.identifiers.length > 0) {
      const rad = index.identifiers.find(id => id.type === 'RADICADO' || id.type === 'PROCESO');
      radicado = rad?.value;
    }

    return {
      id: document.identity.id,
      radicado,
      juzgado: index?.locations?.[0]?.name,
      tipoDocumento: index?.documentType?.value,
      fecha: index?.dates?.[0]?.dateIso,
      method: quality?.method ?? 'Unknown',
      requiresHumanReview: quality?.requiresHumanReview ?? false,
      estado
    };
  }
}
