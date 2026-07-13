import { IndexContributor } from './core.js';
import { Document, IdentifierReference, PlainTextAsset } from '../../../../../../domain/document/index.js';
import { executeRule } from '../rules/core.js';
import { CASE_NUMBER_RULES } from '../rules/case_number.rules.js';

export class CaseNumberExtractor implements IndexContributor {
  contribute(document: Document, index: Partial<any>): void {
    const textAssets = document.assets.all<PlainTextAsset>('PlainText');
    if (textAssets.length === 0) return;

    if (!index.identifiers) index.identifiers = [];

    const seenOffsets = new Set<number>();
    
    for (const textAsset of textAssets) {
      for (const rule of CASE_NUMBER_RULES) {
        const matches = executeRule(textAsset.text, rule);
        for (const match of matches) {
          if (seenOffsets.has(match.offset)) continue;
          seenOffsets.add(match.offset);
          
          const ref: IdentifierReference = {
            value: match.value.trim(),
            type: 'PROCESO', // Interno/Expediente
            evidence: {
              extractor: 'CaseNumberExtractor',
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
