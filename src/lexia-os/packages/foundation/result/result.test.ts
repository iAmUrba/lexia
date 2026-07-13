import test from 'node:test';
import assert from 'node:assert';
import { success, failure } from './index.js';

test('Result Pattern', async (t) => {
  await t.test('success() devuelve ok: true y el value', () => {
    const res = success('LexIA');
    assert.strictEqual(res.ok, true);
    if (res.ok) {
      assert.strictEqual(res.value, 'LexIA');
    }
  });

  await t.test('failure() devuelve ok: false y el error', () => {
    const errorObj = new Error('Hubo un fallo');
    const res = failure(errorObj);
    assert.strictEqual(res.ok, false);
    if (!res.ok) {
      assert.strictEqual(res.error, errorObj);
    }
  });

  await t.test('type narrowing funciona correctamente (tiempo de compilación comprobado)', () => {
    const checkResult = (res: ReturnType<typeof success<number>> | ReturnType<typeof failure<Error>>): number => {
      if (res.ok) {
        return res.value;
      }
      return -1; // En este bloque `res.error` existe, `res.value` no.
    };

    assert.strictEqual(checkResult(success(42)), 42);
    assert.strictEqual(checkResult(failure(new Error('fail'))), -1);
  });
});
