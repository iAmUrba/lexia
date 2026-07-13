import { Document, DocumentIndexAsset } from '@lexia/domain';
import { ValidationRule, ValidationIssue } from '../../contracts/index.js';

export class MissingRadicadoRule implements ValidationRule {
  validate(document: Document): ValidationIssue | null {
    const index = document.assets.latest<DocumentIndexAsset>('DocumentIndex');
    if (!index) return null; // We can't validate radicado if index hasn't run yet.

    const hasRadicado = index.primaryIdentifier || index.identifiers.some(i => i.type === 'RADICADO' || i.type === 'PROCESO');
    
    if (!hasRadicado) {
      return {
        code: 'MISSING_RADICADO',
        severity: 'ERROR',
        message: 'No se encontró un radicado o número de proceso en el documento.',
        relatedAsset: 'DocumentIndex'
      };
    }
    
    return null;
  }
}
