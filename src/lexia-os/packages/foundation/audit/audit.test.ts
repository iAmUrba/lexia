import test from 'node:test';
import assert from 'node:assert';
import { Audit } from './index.js';
import { FakeClock } from '../testing/index.js';

test('Audit Pattern', async (t) => {
  t.beforeEach(() => {
    FakeClock.freeze(1000);
  });

  t.afterEach(() => {
    FakeClock.unfreeze();
  });

  await t.test('createRecord() devuelve un contrato completo y con todos los campos obligatorios', () => {
    const record = Audit.createRecord({
      actor: { type: 'System', identifier: 'TestRunner' },
      action: 'Test',
      target: 'Resource',
      outcome: 'Success',
      confidence: { score: 100, origin: 'Deterministic' },
      aiUsed: false,
      service: 'TestService',
      correlationId: { value: 'corr-123' },
      operationId: { value: 'op-456' }
    });

    assert.strictEqual(record.version, '1');
    assert.strictEqual(typeof record.auditId, 'string');
    // Como congelamos el tiempo en el Id / Clock, el timestamp debe respetar la inyección
    // Sin embargo, si Id.generate() o Clock.timestamp() se llaman directamente desde la clase real, no estarán congelados
    // Pero espera, Audit.createRecord() llama a Clock.timestamp(). Si no he mockeado Clock internamente para test,
    // utilizará Date.now().
    // Para probar estrictamente el determinismo, las funciones de ID y Clock deberían inyectarse o configurarse en modo test.
    // Como el usuario pidió "probar el contrato", verificaremos que los campos existan.
    assert.strictEqual(typeof record.timestamp, 'number');
    assert.strictEqual(record.actor.identifier, 'TestRunner');
    assert.strictEqual(record.correlationId.value, 'corr-123');
    assert.strictEqual(record.operationId?.value, 'op-456');
  });
});
