import { test, describe } from 'node:test';
import assert from 'node:assert';
import { Document, PlainTextAsset, DocumentIndexAsset } from '../../../../domain/document/index.js';
import { Id } from '../../../../foundation/id/index.js';
import { RadicadoExtractor } from './contributors/RadicadoExtractor.js';
import { CourtExtractor } from './contributors/CourtExtractor.js';
import { DateExtractor } from './contributors/DateExtractor.js';
import { buildDocumentIndexDescriptor } from './index.js';
import { CapabilityContext } from '../../../../engine/index.js';
import { AssetCollectionImpl } from '../../../../domain/document/assembler/AssetCollectionImpl.js';

const FakeClock = {
  time: 1000,
  timestamp: () => FakeClock.time,
  advance: (ms: number) => { FakeClock.time += ms; }
};

const FakeContext: CapabilityContext = {
  clock: FakeClock,
  logger: { info: () => {}, error: () => {}, debug: () => {}, warn: () => {} },
  audit: { log: () => {} } as any,
  events: { emit: () => {} } as any,
  trace: { startSpan: () => ({ end: () => {} }) } as any
};

describe('Deterministic Indexer: document.index', () => {
  test('Debe extraer radicados, juzgados y fechas a partir de un texto plano y generar FieldEvidence', async () => {
    // 1. Preparar un Documento con PlainTextAsset
    const plainTextStr = `
      JUZGADO SEXTO CIVIL DEL CIRCUITO DE BOGOTÁ
      Auto Interlocutorio No. 123
      Fecha: 15 de julio de 2025
      
      Radicado: 11001310300620240012300
      
      Resuelve:
      Página 1 de 4
    `;

    const textAsset: PlainTextAsset = {
      assetId: { value: 'text-123' },
      assetType: 'PlainText',
      version: 1,
      producer: { value: 'reader.pdf.extract.v1' },
      producedAt: 1000,
      confidence: { score: 100, origin: 'Deterministic' },
      text: plainTextStr,
      encoding: 'utf-8',
      language: 'es',
      pageCount: 1,
      source: 'PDF_Native'
    };

    const doc: Document = {
      identity: { id: 'doc-123' },
      provenance: { fingerprint: 'a', origin: 'b', receivedAt: 1 },
      timeline: { operations: [] },
      assets: new AssetCollectionImpl([textAsset])
    };

    // 2. Inicializar orquestador y contribuidores
    const contributors = [
      new RadicadoExtractor(),
      new CourtExtractor(),
      new DateExtractor()
    ];
    const descriptor = buildDocumentIndexDescriptor(contributors);
    const instance = await descriptor.createInstance();

    // 3. Ejecutar Capability
    const output = await instance.execute(doc, FakeContext);

    // 4. Validar resultados
    assert.strictEqual(output.length, 1, 'Debe producir un único Asset');
    const indexAsset = output[0] as DocumentIndexAsset;
    assert.strictEqual(indexAsset.assetType, 'DocumentIndex');
    
    // Radicados
    assert.strictEqual(indexAsset.identifiers.length, 1, 'Debe detectar 1 radicado');
    assert.strictEqual(indexAsset.identifiers[0].value, '11001310300620240012300');
    assert.strictEqual(indexAsset.identifiers[0].evidence.rule, 'radicado-colombia-v1');
    assert.strictEqual(indexAsset.identifiers[0].evidence.extractor, 'RadicadoExtractor');

    // Juzgados
    assert.strictEqual(indexAsset.locations.length, 1, 'Debe detectar 1 juzgado');
    assert.strictEqual(indexAsset.locations[0].name, 'JUZGADO SEXTO CIVIL DEL CIRCUITO DE BOGOTÁ');

    // Fechas
    assert.strictEqual(indexAsset.dates.length, 1, 'Debe detectar 1 fecha');
    assert.strictEqual(indexAsset.dates[0].originalText, '15 de julio de 2025');
  });
});
