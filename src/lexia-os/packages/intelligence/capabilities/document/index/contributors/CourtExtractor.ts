import { IndexContributor } from './core.js';
import { Document, LocationReference, PlainTextAsset } from '../../../../../../domain/document/index.js';
import { executeRule } from '../rules/core.js';
import { COURT_RULES } from '../rules/court.rules.js';

export class CourtExtractor implements IndexContributor {
  contribute(document: Document, index: Partial<any>): void {
    const textAssets = document.assets.all<PlainTextAsset>('PlainText');
    if (textAssets.length === 0) return;

    if (!index.locations) index.locations = [];

    for (const textAsset of textAssets) {
      for (const rule of COURT_RULES) {
        const matches = executeRule(textAsset.text, rule);
        for (const match of matches) {
          const ref: LocationReference = {
            name: match.value.trim(),
            evidence: {
              extractor: 'CourtExtractor',
              rule: match.rule.id,
              offset: match.offset,
              length: match.length,
              confidence: match.rule.confidence
            }
          };
          index.locations.push(ref);
        }
      }
    }
  }
}
