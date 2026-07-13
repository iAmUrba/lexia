import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PdfParseAdapter } from '../../../../adapters/pdf/index.js';
import { buildPdfExtractDescriptor } from './extract.js';
import { CapabilityContext } from '../../../../engine/index.js';
import { DocumentSource, DocumentStream } from '../../../../io/index.js';
import { Document, DocumentAssembler, PlainTextAsset, MetadataAsset, ExtractionQualityAsset } from '../../../../domain/document/index.js';
import { AssetCollectionImpl } from '../../../../domain/document/assembler/AssetCollectionImpl.js';

const FakeClock = {
  time: 1000,
  freeze: (t: number) => { FakeClock.time = t; },
  unfreeze: () => {},
  timestamp: () => FakeClock.time
};

test('End-to-End: Reader PDF Real con Patrón Adapter', async (t) => {
  t.beforeEach(() => { FakeClock.freeze(1000); });
  t.afterEach(() => { FakeClock.unfreeze(); });

  await t.test('Extrae texto nativo y metadata de simple.pdf y ensambla el documento', async () => {
    // 1. Preparar I/O (DocumentSource y DocumentStream)
    const fixturePath = path.resolve(process.cwd(), '../../fixtures/pdf/public/simple/dummy.pdf');
    const expectedPath = path.resolve(process.cwd(), '../../fixtures/pdf/public/simple/expected.json');
    const buffer = fs.readFileSync(fixturePath);
    
    const source: DocumentSource = {
      origin: 'FileSystem',
      pathOrUri: fixturePath,
      receivedAt: 1000,
      byteSize: buffer.length
    };

    const stream: DocumentStream = {
      source,
      readAllAsBuffer: async () => buffer,
      readChunk: async (s, e) => buffer.subarray(s, e),
      getStream: () => { throw new Error('Not implemented for this test'); }
    };

    // 2. Preparar Execution Context
    const context: CapabilityContext = {
      abortSignal: new AbortController().signal,
      correlationId: { value: 'corr-real-1' },
      operationId: { value: 'op-real-1' },
      clock: FakeClock,
      logger: { info: () => {}, error: () => {} },
      audit: { record: async () => {} } as any,
      events: { emit: async () => {} } as any,
      config: { get: () => null },
      metrics: { record: () => {} },
      trace: { startSpan: () => ({ end: () => {} }), endSpan: () => {} } as any
    };

    // 3. Inicializar la Capability con el Adapter real
    const adapter = new PdfParseAdapter();
    const descriptor = buildPdfExtractDescriptor(adapter);
    const instance = await descriptor.createInstance();

    // 4. Ejecutar la capacidad real (¡Sin Dummy!)
    const assets = await instance.execute(stream, context);

    // Creamos un Snapshot
    const snapshot = {
      producer: descriptor.id,
      operationId: context.operationId,
      correlationId: context.correlationId,
      durationMs: 300,
      assets
    };

    // 5. Ensamblar en el Dominio
    const initialDocument: Document = {
      identity: { id: 'doc-pdf-1' },
      provenance: { fingerprint: 'pdf-123', origin: 'local_fs', receivedAt: FakeClock.timestamp() },
      assets: new AssetCollectionImpl([]),
      timeline: { operations: [{ operation: 'Created', timestamp: 1000, actor: 'System' }] }
    };

    const assembler = new DocumentAssembler();
    
    FakeClock.freeze(1500); // Avanzamos el reloj
    const newDoc = assembler.applySnapshot(initialDocument, snapshot);

    // 6. Validaciones End-to-End
    const expectedPath2 = path.resolve(process.cwd(), '../../fixtures/pdf/public/simple/expected.json');
    const expected = JSON.parse(fs.readFileSync(expectedPath2, 'utf8'));

    assert.strictEqual(newDoc.assets.items.length, 3, 'Debe haber generado Metadata, PlainText y ExtractionQuality');
    
    const metadata = newDoc.assets.find(a => a.assetType === 'Metadata') as MetadataAsset;
    assert.ok(metadata);
    
    const text = newDoc.assets.find(a => a.assetType === 'PlainText') as PlainTextAsset;
    assert.ok(text);
    assert.ok(text.text.length > 0);

    const quality = newDoc.assets.find(a => a.assetType === 'ExtractionQuality') as ExtractionQualityAsset;
    assert.ok(quality, 'ExtractionQualityAsset debe existir');
    
    assert.strictEqual(quality.method, expected.method, `Method debe ser ${expected.method}`);
    assert.strictEqual(quality.requiresHumanReview, expected.requiresHumanReview, `requiresHumanReview debe ser ${expected.requiresHumanReview}`);
    assert.ok(quality.extractedCharacters >= expected.minimumCharacters, 'Debe extraer al menos los caracteres mínimos esperados');
    assert.deepStrictEqual(quality.warnings, expected.warnings, 'Warnings deben coincidir');
  });
});
