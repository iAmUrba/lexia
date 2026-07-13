import { test, describe } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { CapabilityContext } from '../../engine/index.js';
import { DocumentSource, DocumentStream } from '../../io/index.js';
import { Document, DocumentAssembler, DocumentIndexAsset, PlainTextAsset, MetadataAsset, ExtractionQualityAsset } from '../../domain/document/index.js';
import { AssetCollectionImpl } from '../../domain/document/assembler/AssetCollectionImpl.js';
import { DocumentStateEvaluator } from '../../domain/document/state/DocumentStateEvaluator.js';
import { buildPdfExtractDescriptor } from '../capabilities/reader/pdf/extract.js';
import { PdfParseAdapter } from '../../adapters/pdf/index.js';
import { buildDocumentIndexDescriptor } from '../capabilities/document/index/index.js';
import { RadicadoExtractor } from '../capabilities/document/index/contributors/RadicadoExtractor.js';
import { CourtExtractor } from '../capabilities/document/index/contributors/CourtExtractor.js';
import { DateExtractor } from '../capabilities/document/index/contributors/DateExtractor.js';
import { CaseNumberExtractor } from '../capabilities/document/index/contributors/CaseNumberExtractor.js';
import { DocumentTypeExtractor } from '../capabilities/document/index/contributors/DocumentTypeExtractor.js';

const FakeClock = {
  time: 1000,
  timestamp: () => FakeClock.time,
  advance: (ms: number) => { FakeClock.time += ms; }
};

const FakeContext: CapabilityContext = {
  clock: FakeClock,
  logger: { info: () => {}, error: () => {}, debug: () => {}, warn: () => {} },
  audit: { log: () => {}, record: async () => {} } as any,
  events: { emit: async () => {} } as any,
  trace: { startSpan: () => ({ end: () => {} }) } as any
};

describe('Fase 6: Primer Pipeline Cognitivo E2E', () => {
  test('Flujo E2E desde un PDF raw hasta un Document final enriquecido y evaluado', async () => {
    // 1. Inicializar herramientas del Dominio
    const assembler = new DocumentAssembler();
    const evaluator = new DocumentStateEvaluator();

    // 2. Inicializar Capabilities (simulando Registry)
    const adapter = new PdfParseAdapter();
    const pdfReaderDescriptor = buildPdfExtractDescriptor(adapter);
    const pdfReader = await pdfReaderDescriptor.createInstance();

    const indexContributors = [
      new RadicadoExtractor(),
      new CourtExtractor(),
      new DateExtractor(),
      new CaseNumberExtractor(),
      new DocumentTypeExtractor()
    ];
    const indexerDescriptor = buildDocumentIndexDescriptor(indexContributors);
    const indexer = await indexerDescriptor.createInstance();

    // 3. DocumentSource -> Cargar el archivo físico
    const fixturePath = path.resolve(process.cwd(), '../../fixtures/pdf/public/simple/dummy.pdf');
    const buffer = fs.readFileSync(fixturePath);
    
    const source: DocumentSource = {
      origin: 'FileSystem',
      pathOrUri: fixturePath,
      receivedAt: 1000,
      byteSize: buffer.length,
      fingerprint: 'dummy-123'
    };

    const stream: DocumentStream = {
      source,
      readAllAsBuffer: async () => buffer,
      readChunk: async (s, e) => buffer.subarray(s, e),
      getStream: () => { throw new Error('Not implemented for this test'); }
    };

    // 4. Crear el Document 1.0
    let currentDocument: Document = {
      identity: { id: 'doc-e2e-1' },
      provenance: { fingerprint: source.fingerprint, origin: source.origin, receivedAt: FakeClock.timestamp() },
      assets: new AssetCollectionImpl([]),
      timeline: { operations: [{ operation: 'Created', timestamp: FakeClock.timestamp(), actor: 'System' }] }
    };

    // 5. Evaluamos el estado: DEBE NECESITAR TEXTO
    let state = evaluator.evaluate(currentDocument);
    assert.ok(state.missingCapabilities.includes('NEEDS_TEXT'));

    // 6. Ejecutamos reader.pdf.extract
    FakeClock.advance(10);
    const pdfSnapshotAssets = await pdfReader.execute(stream, FakeContext);
    
    // Simular el Snapshot
    const pdfSnapshot = {
      producer: pdfReaderDescriptor.id,
      operationId: { value: 'op-pdf-1' },
      correlationId: { value: 'corr-1' },
      durationMs: 50,
      assets: pdfSnapshotAssets
    };
    
    // 7. Assembler aplica el snapshot y genera Document 2.0
    currentDocument = assembler.applySnapshot(currentDocument, pdfSnapshot);

    // Verificamos inmutabilidad y contenido
    assert.strictEqual(currentDocument.assets.items.length, 3);
    assert.ok(currentDocument.assets.has('PlainText'));
    assert.ok(currentDocument.assets.has('Metadata'));
    assert.ok(currentDocument.assets.has('ExtractionQuality'));

    // 8. Evaluamos de nuevo: DEBE NECESITAR ÍNDICE
    state = evaluator.evaluate(currentDocument);
    assert.ok(!state.missingCapabilities.includes('NEEDS_TEXT'));
    assert.ok(state.missingCapabilities.includes('NEEDS_INDEX'));

    // 9. Ejecutamos document.index
    FakeClock.advance(10);
    const indexSnapshotAssets = await indexer.execute(currentDocument, FakeContext);
    
    // Simular el Snapshot del Indexador
    const indexSnapshot = {
      producer: indexerDescriptor.id,
      operationId: { value: 'op-index-1' },
      correlationId: { value: 'corr-1' },
      durationMs: 5,
      assets: indexSnapshotAssets
    };

    // 10. Assembler aplica el snapshot del index y genera Document 3.0
    currentDocument = assembler.applySnapshot(currentDocument, indexSnapshot);

    // 11. Verificamos el índice en el documento final
    assert.ok(currentDocument.assets.has('DocumentIndex'));
    const documentIndex = currentDocument.assets.latest<DocumentIndexAsset>('DocumentIndex');
    assert.ok(documentIndex);
    assert.strictEqual(documentIndex.identifiers.length, 0, 'simple.pdf no contiene radicados reales');

    // 12. Evaluación Final
    state = evaluator.evaluate(currentDocument);
    assert.strictEqual(state.missingCapabilities.length, 0, 'No debe faltar ninguna capability prioritaria');
    assert.strictEqual(state.readyForClassification, true);
    assert.strictEqual(state.readyForDrafting, true);

    // Verificar Timeline
    assert.strictEqual(currentDocument.timeline.operations.length, 3, 'Created -> PDF Extract -> Indexing');
  });
});
