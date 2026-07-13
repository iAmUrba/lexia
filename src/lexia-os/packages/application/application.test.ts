import { test, describe } from 'node:test';
import assert from 'node:assert';
import { CaseHeaderProjector } from './projectors/CaseHeaderProjector.js';
import { MissingRadicadoRule } from './validators/rules/MissingRadicadoRule.js';
import { MissingCourtRule } from './validators/rules/MissingCourtRule.js';
import { DocumentValidator } from './validators/DocumentValidator.js';
import { GetCaseHeader } from './queries/GetCaseHeader.js';
import { Document, DocumentIndexAsset, AssetCollectionImpl } from '@lexia/domain';

describe('LexIA Application Layer', () => {
  const mockIdentity = { id: 'doc-123' };
  const mockProvenance = { fingerprint: 'fp1', origin: 'API', receivedAt: Date.now() };
  const mockTimeline = { operations: [] };

  test('El Proyector y Validador manejan un Documento completamente extraído', () => {
    const indexAsset: DocumentIndexAsset = {
      assetId: { value: 'idx-1' },
      assetType: 'DocumentIndex',
      version: 1,
      producer: { value: 'doc.index' },
      producedAt: Date.now(),
      confidence: { score: 100, origin: 'Deterministic' },
      identifiers: [
        { type: 'RADICADO', value: '11001-31-03-006-2024-00123-00', evidence: {} as any }
      ],
      locations: [
        { name: 'JUZGADO SEXTO PENAL', evidence: {} as any }
      ],
      dates: [],
      people: [],
      citations: []
    };

    const document: Document = {
      identity: mockIdentity,
      provenance: mockProvenance,
      assets: new AssetCollectionImpl([indexAsset]),
      timeline: mockTimeline
    };

    const projector = new CaseHeaderProjector();
    const validator = new DocumentValidator([new MissingRadicadoRule(), new MissingCourtRule()]);
    const query = new GetCaseHeader(projector, validator);

    const result = query.execute(document);

    // Assert Projection
    assert.strictEqual(result.view.id, 'doc-123');
    assert.strictEqual(result.view.radicado, '11001-31-03-006-2024-00123-00');
    assert.strictEqual(result.view.juzgado, 'JUZGADO SEXTO PENAL');
    
    // Assert Validation
    assert.strictEqual(result.validation.hasErrors, false);
    assert.strictEqual(result.validation.hasWarnings, false);
    assert.strictEqual(result.validation.issues.length, 0);
  });

  test('El Validador emite ERROR si falta radicado y WARNING si falta juzgado', () => {
    // Documento donde el extractor corrió pero no encontró nada
    const indexAsset: DocumentIndexAsset = {
      assetId: { value: 'idx-2' },
      assetType: 'DocumentIndex',
      version: 1,
      producer: { value: 'doc.index' },
      producedAt: Date.now(),
      confidence: { score: 100, origin: 'Deterministic' },
      identifiers: [],
      locations: [],
      dates: [],
      people: [],
      citations: []
    };

    const document: Document = {
      identity: mockIdentity,
      provenance: mockProvenance,
      assets: new AssetCollectionImpl([indexAsset]),
      timeline: mockTimeline
    };

    const projector = new CaseHeaderProjector();
    const validator = new DocumentValidator([new MissingRadicadoRule(), new MissingCourtRule()]);
    const query = new GetCaseHeader(projector, validator);

    const result = query.execute(document);

    // Assert Projection (vacía)
    assert.strictEqual(result.view.radicado, undefined);
    assert.strictEqual(result.view.juzgado, undefined);
    
    // Assert Validation (debe contener errores y warnings)
    assert.strictEqual(result.validation.hasErrors, true);
    assert.strictEqual(result.validation.hasWarnings, true);
    assert.strictEqual(result.validation.issues.length, 2);

    const radicadoIssue = result.validation.issues.find(i => i.code === 'MISSING_RADICADO');
    assert.ok(radicadoIssue);
    assert.strictEqual(radicadoIssue.severity, 'ERROR');

    const courtIssue = result.validation.issues.find(i => i.code === 'MISSING_COURT');
    assert.ok(courtIssue);
    assert.strictEqual(courtIssue.severity, 'WARNING');
  });
});
