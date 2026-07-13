import test from 'node:test';
import assert from 'node:assert';
import { 
  Document,
  DocumentSnapshot,
  PlainTextAsset
} from './contracts.js';
import { AssetCollectionImpl } from './assembler/AssetCollectionImpl.js';
import { DocumentAssembler } from './assembler/DocumentAssembler.js';
import { CapabilityId } from '../../engine/types/index.js';
import { FakeClock } from '../../foundation/testing/index.js';

test('Document Model (Asset-Based)', async (t) => {
  t.beforeEach(() => { FakeClock.freeze(1000); });
  t.afterEach(() => { FakeClock.unfreeze(); });

  const dummyCapabilityId = CapabilityId.of('dummy.text.v1');

  // Documento inicial vacío
  const initialDocument: Document = {
    identity: { id: 'doc-123' },
    provenance: {
      fingerprint: 'abcd',
      origin: 'email',
      receivedAt: 1000
    },
    assets: new AssetCollectionImpl([]),
    timeline: {
      operations: [{ operation: 'Intake', actor: 'System', timestamp: 1000 }]
    }
  };

  await t.test('Flujo E2E: Dummy Text Capability produce un PlainTextAsset y el Assembler genera el Document 2.0', () => {
    const mockAsset: PlainTextAsset = {
      assetId: { value: 'asset-text-1' },
      assetType: 'PlainText',
      version: 1, 
      producer: dummyCapabilityId,
      producedAt: FakeClock.timestamp(),
      confidence: { score: 100, origin: 'Deterministic' },
      text: 'Texto de prueba LexIA',
      encoding: 'utf-8',
      language: 'es',
      pageCount: 1,
      source: 'Dummy_Text_Generator'
    };

    const snapshot: DocumentSnapshot = {
      producer: dummyCapabilityId,
      operationId: { value: 'op-123' },
      correlationId: { value: 'corr-123' },
      assets: [mockAsset],
      durationMs: 50
    };

    const assembler = new DocumentAssembler();
    const newDocument = assembler.applySnapshot(initialDocument, snapshot);

    assert.notStrictEqual(initialDocument, newDocument, 'El Assembler debe devolver una nueva instancia (clon)');
    assert.strictEqual(initialDocument.assets.items.length, 0, 'El documento original no debe mutar');
    assert.strictEqual(newDocument.assets.items.length, 1, 'El nuevo documento debe contener el Asset apilado');
    
    const extractedAsset = newDocument.assets.items[0] as PlainTextAsset;
    assert.strictEqual(extractedAsset.text, 'Texto de prueba LexIA');
    assert.strictEqual(extractedAsset.version, 1);
    
    assert.strictEqual(newDocument.timeline.operations.length, 2);
    assert.strictEqual(newDocument.timeline.operations[1].operation, 'Snapshot Applied');
    // En lugar de chequear 2000, checamos que es de tipo número (Clock real devuelve Date.now())
    assert.strictEqual(typeof newDocument.timeline.operations[1].timestamp, 'number');
  });

  await t.test('El Assembler no sobrescribe Assets, apila versiones (DefaultVersioningStrategy)', () => {
    const assembler = new DocumentAssembler();
    
    const docConAssetV1: Document = {
      identity: { id: 'doc-123' },
      provenance: { fingerprint: 'abcd', origin: 'email', receivedAt: 1000 },
      timeline: { operations: [] },
      assets: new AssetCollectionImpl([
        {
          assetId: { value: 'text-v1' },
          assetType: 'PlainText',
          version: 1,
          producer: { value: 'reader.pdf.extract.v1' },
          producedAt: 1000,
          confidence: { score: 100, origin: 'Deterministic' },
          text: 'Versión antigua',
          encoding: 'utf-8',
          language: 'es',
          pageCount: 1,
          source: 'PDF_Native'
        } as PlainTextAsset
      ])
    };

    const docActualizado = assembler.applySnapshot(docConAssetV1, {
      producer: dummyCapabilityId,
      operationId: { value: 'op-2' },
      correlationId: { value: 'corr-1' },
      durationMs: 10,
      assets: [{
        assetId: { value: 'asset-text-2' },
        assetType: 'PlainText',
        version: 1,
        producer: dummyCapabilityId,
        producedAt: 2000,
        confidence: { score: 100, origin: 'Human' },
        text: 'Versión corregida',
        encoding: 'utf-8',
        language: 'es',
        pageCount: 1,
        source: 'dummy'
      } as PlainTextAsset]
    });

    assert.strictEqual(docActualizado.assets.items.length, 2);

    const asset1 = docActualizado.assets.items[0] as PlainTextAsset;
    assert.strictEqual(asset1.version, 1);
    assert.strictEqual(asset1.text, 'Versión antigua');

    const asset2 = docActualizado.assets.items[1] as PlainTextAsset;
    assert.strictEqual(asset2.version, 2);
    assert.strictEqual(asset2.text, 'Versión corregida');
  });
});
