import { IndexContributor } from './core.js';
import { Document, DocumentTypeReference, PlainTextAsset } from '../../../../../../domain/document/index.js';
import { executeRule } from '../rules/core.js';
import { DOCUMENT_TYPE_RULES } from '../rules/document_type.rules.js';

export class DocumentTypeExtractor implements IndexContributor {
  contribute(document: Document, index: Partial<any>): void {
    const textAssets = document.assets.all<PlainTextAsset>('PlainText');
    if (textAssets.length === 0) return;

    // Solo necesitamos encontrar el primer tipo de documento que haga match con mayor confianza
    // Por simplicidad, tomaremos el primer match que aparezca en el texto
    
    for (const textAsset of textAssets) {
      for (const rule of DOCUMENT_TYPE_RULES) {
        const matches = executeRule(textAsset.text, rule);
        if (matches.length > 0) {
          const match = matches[0];
          const ref: DocumentTypeReference = {
            value: match.value.toUpperCase().trim(),
            evidence: {
              extractor: 'DocumentTypeExtractor',
              rule: match.rule.id,
              offset: match.offset,
              length: match.length,
              confidence: match.rule.confidence
            }
          };
          index.documentType = ref;
          return; // Encontramos el tipo, terminamos
        }
      }
    }
  }
}
