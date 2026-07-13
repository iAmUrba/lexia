import { Document, DocumentIndexAsset } from '@lexia/domain';
import { ValidationRule, ValidationIssue } from '../../contracts/index.js';

export class MissingCourtRule implements ValidationRule {
  validate(document: Document): ValidationIssue | null {
    const index = document.assets.latest<DocumentIndexAsset>('DocumentIndex');
    if (!index) return null; 

    const hasCourt = index.locations && index.locations.length > 0;
    
    if (!hasCourt) {
      return {
        code: 'MISSING_COURT',
        severity: 'WARNING',
        message: 'No se identificó el juzgado emisor en este documento.',
        relatedAsset: 'DocumentIndex'
      };
    }
    
    return null;
  }
}
