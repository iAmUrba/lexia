import { IndexContributor } from './core.js';
import { Document, DateReference, PlainTextAsset } from '../../../../../../domain/document/index.js';
import { executeRule } from '../rules/core.js';
import { DATE_RULES } from '../rules/dates.rules.js';

export class DateExtractor implements IndexContributor {
  contribute(document: Document, index: Partial<any>): void {
    const textAssets = document.assets.all<PlainTextAsset>('PlainText');
    if (textAssets.length === 0) return;

    if (!index.dates) index.dates = [];

    for (const textAsset of textAssets) {
      for (const rule of DATE_RULES) {
        const matches = executeRule(textAsset.text, rule);
        for (const match of matches) {
          const ref: DateReference = {
            dateIso: '', // Simplificación: habría que parsear el regex match a ISO
            originalText: match.value.trim(),
            evidence: {
              extractor: 'DateExtractor',
              rule: match.rule.id,
              offset: match.offset,
              length: match.length,
              confidence: match.rule.confidence
            }
          };
          index.dates.push(ref);
        }
      }
    }
  }
}
