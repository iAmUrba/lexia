import test from 'node:test';
import assert from 'node:assert';
import { DocumentIntakeService } from './DocumentIntakeService.js';
import { FakeAuditSink } from '../../../foundation/testing/index.js';

test('LexIA Pipeline Pattern: Document Intake', async (t) => {
  await t.test('El pipeline sigue estrictamente: Input -> Receipt -> Audit -> Result', async () => {
    const fakeSink = new FakeAuditSink();
    const service = new DocumentIntakeService(fakeSink);

    const buffer = Buffer.from('Prueba de Pipeline determinista');
    
    // 1. INPUT
    const result = await service.process({
      buffer,
      mimeType: 'text/plain',
      originalName: 'pipeline.txt',
      source: 'Test_Suite',
      actor: { type: 'System', identifier: 'TestRunner' }
    });

    // 5. RESULT (El resultado debe ser exitoso y contener el Receipt)
    assert.strictEqual(result.ok, true);
    if (result.ok) {
      const receipt = result.value;
      
      // 2. RECEIPT (Se genera y devuelve correctamente)
      assert.strictEqual(receipt.mimeType, 'text/plain');
      assert.strictEqual(typeof receipt.receiptId, 'string');
      assert.strictEqual(receipt.fingerprint.algorithm, 'sha256');

      // 3. AUDIT (Se registró exactamente un evento de auditoría)
      assert.strictEqual(fakeSink.records.length, 1);
      const audit = fakeSink.records[0];
      
      assert.strictEqual(audit.action, 'DocumentIntake');
      assert.strictEqual(audit.target, receipt.receiptId); // El target de Intake es el receipt
      assert.strictEqual(audit.correlationId.value, receipt.receiptId); // El correlation root es el receipt
      
      // 4. DOMAIN EVENT
      // El EventBus emite, lo probamos en el test de EventBus.
      // (Podríamos inyectar FakeEventBus en Intake si lo pasamos por constructor, pero por ahora usa estático).
    }
  });
});
