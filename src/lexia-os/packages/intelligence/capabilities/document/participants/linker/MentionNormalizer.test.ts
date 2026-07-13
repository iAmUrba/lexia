import test from 'node:test';
import assert from 'node:assert';
import { MentionNormalizer } from './MentionNormalizer.js';
import { ParticipantMention } from '@lexia/domain';

function createDummyMention(rawText: string): ParticipantMention {
  return {
    id: 'test-1',
    rawText,
    kind: 'PERSON',
    detectionKind: 'UNKNOWN',
    evidence: { extractor: 'test', rule: 'test', offset: 0, length: rawText.length, confidence: { score: 100, confidence: 'high' } }
  };
}

test('MentionNormalizer - Limpieza de honoríficos y prefijos', () => {
  const normalizer = new MentionNormalizer();

  const cases = [
    { input: 'Dr. Juan Pérez', expected: 'Juan Pérez' },
    { input: 'JUEZ JUAN PÉREZ', expected: 'Juan Pérez' },
    { input: 'JUAN PÉREZ GÓMEZ', expected: 'Juan Pérez Gómez' },
    { input: 'el fiscal Carlos', expected: 'Carlos' },
    { input: 'La Doctora María', expected: 'María' }
  ];

  for (const c of cases) {
    const mention = createDummyMention(c.input);
    const result = normalizer.normalize(mention);
    assert.strictEqual(result.normalizedText, c.expected, `Falló normalizando: ${c.input}`);
    // Asegurar que no se mutó el original
    assert.strictEqual(result.rawText, c.input);
  }
});
