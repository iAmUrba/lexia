import test from 'node:test';
import assert from 'node:assert';
import { ParticipantExtractor } from './ParticipantExtractor.js';
import { DetectionRule } from './rules/DetectionRule.js';
import { ParticipantMention } from '@lexia/domain';

// Regla mock simple para la prueba
class MockRule implements DetectionRule {
  id = 'mock-rule';
  priority = 100;

  detect(text: string, extractorName: string): ParticipantMention[] {
    const mentions: ParticipantMention[] = [];
    const pattern = /juez\s+([A-Z][a-záéíóú]+\s+[A-Z][a-záéíóú]+)/ig;
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
      mentions.push({
        id: `mention-${match.index}`,
        rawText: match[0],
        normalizedText: match[1],
        kind: 'PERSON',
        detectionKind: 'ROLE_PREFIX',
        evidence: {
          extractor: extractorName,
          rule: this.id,
          offset: match.index,
          length: match[0].length,
          confidence: { score: 95, confidence: 'high' }
        }
      });
    }
    
    return mentions;
  }
}

test('ParticipantExtractor - Extracción básica de menciones', () => {
  const extractor = new ParticipantExtractor([new MockRule()]);
  
  const text = 'El juez Juan Pérez dictó la sentencia y luego el juez Juan Pérez firmó el acta.';
  const mentions = extractor.extract(text);

  assert.strictEqual(mentions.length, 2, 'Debería detectar dos menciones separadas');
  
  // Verifica que NO se deduplicaron
  assert.strictEqual(mentions[0].rawText.toLowerCase(), 'juez juan pérez');
  assert.strictEqual(mentions[0].evidence.offset, 3);
  
  assert.strictEqual(mentions[1].rawText.toLowerCase(), 'juez juan pérez');
  assert.strictEqual(mentions[1].evidence.offset, 49);
});
