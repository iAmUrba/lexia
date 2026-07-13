import { IndexContributor } from './core.js';
import { Document, IdentifierReference, PlainTextAsset } from '../../../../../../domain/document/index.js';
import { executeRule } from '../rules/core.js';
import { RADICADO_RULES } from '../rules/radicado.rules.js';

export class RadicadoExtractor implements IndexContributor {
  contribute(document: Document, index: Partial<any>): void {
    const textAssets = document.assets.all<PlainTextAsset>('PlainText');
    if (textAssets.length === 0) return;

    if (!index.identifiers) index.identifiers = [];

    const seenOffsets = new Set<number>();
    
    for (const textAsset of textAssets) {
      for (const rule of RADICADO_RULES) {
        const matches = executeRule(textAsset.text, rule);
        for (const match of matches) {
          if (seenOffsets.has(match.offset)) continue;
          seenOffsets.add(match.offset);
          
          const ref: IdentifierReference = {
            value: match.value.trim(),
            type: 'RADICADO',
            evidence: {
              extractor: 'RadicadoExtractor',
              rule: match.rule.id,
              offset: match.offset,
              length: match.length,
              confidence: match.rule.confidence
            }
          };
          index.identifiers.push(ref);
        }
      }
    }
  }
}
