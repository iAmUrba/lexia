import test from 'node:test';
import assert from 'node:assert';
import { Confidence } from './index.js';

test('Confidence Pattern', async (t) => {
  await t.test('create() funciona dentro de los límites válidos', () => {
    const c = Confidence.create(85, 'LLM', 'Reconocimiento básico');
    assert.strictEqual(c.score, 85);
    assert.strictEqual(c.origin, 'LLM');
    assert.strictEqual(c.explanation, 'Reconocimiento básico');
  });

  await t.test('create() lanza error si el score es negativo', () => {
    assert.throws(() => Confidence.create(-1, 'Human'), {
      message: "Confidence score must be between 0 and 100"
    });
  });

  await t.test('create() lanza error si el score es mayor a 100', () => {
    assert.throws(() => Confidence.create(101, 'OCR'), {
      message: "Confidence score must be between 0 and 100"
    });
  });

  await t.test('exactMatch() siempre devuelve score 100 y origin Regex', () => {
    const c = Confidence.exactMatch();
    assert.strictEqual(c.score, 100);
    assert.strictEqual(c.origin, 'Regex');
  });

  await t.test('deterministic() siempre devuelve score 100 y origin Deterministic', () => {
    const c = Confidence.deterministic('Por Hash');
    assert.strictEqual(c.score, 100);
    assert.strictEqual(c.origin, 'Deterministic');
    assert.strictEqual(c.explanation, 'Por Hash');
  });

  await t.test('humanValidated() siempre devuelve score 100 y origin Human', () => {
    const c = Confidence.humanValidated();
    assert.strictEqual(c.score, 100);
    assert.strictEqual(c.origin, 'Human');
  });
});
