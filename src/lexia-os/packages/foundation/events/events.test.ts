import test from 'node:test';
import assert from 'node:assert';
import { FakeEventBus } from '../testing/index.js';

test('EventBus Pattern (Fake)', async (t) => {
  await t.test('Los eventos se publican en orden estricto a los listeners síncronos', async () => {
    const bus = new FakeEventBus();
    const result: string[] = [];
    
    bus.subscribe('TestEvent', () => { result.push('A'); });
    bus.subscribe('TestEvent', () => { result.push('B'); });
    bus.subscribe('TestEvent', () => { result.push('C'); });

    await bus.publish('TestEvent', {});

    assert.deepStrictEqual(result, ['A', 'B', 'C']);
  });

  await t.test('Una excepción en un listener no detiene la ejecución de los siguientes', async () => {
    const bus = new FakeEventBus();
    const result: string[] = [];
    
    bus.subscribe('FailEvent', () => { result.push('A'); });
    bus.subscribe('FailEvent', () => { throw new Error('Boom'); });
    bus.subscribe('FailEvent', () => { result.push('C'); });

    // En la implementación real y en el FakeEventBus de test, Promise.allSettled o manejo de errores evita el crash
    await bus.publish('FailEvent', {});

    assert.deepStrictEqual(result, ['A', 'C']);
  });
});
