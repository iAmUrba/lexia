import test from 'node:test';
import assert from 'node:assert';
import { CaseBuilder } from './CaseBuilder.js';
import { CaseDocument } from '@lexia/domain';

test('CaseBuilder - Construcción inmutable y determinista', () => {
  const builder = new CaseBuilder('case-123', { deduplicateDocuments: true });

  const doc1: CaseDocument = {
    documentId: 'doc-1',
    relation: 'PRINCIPAL',
    addedAt: '2026-07-13T10:00:00Z',
    source: 'upload'
  };

  const doc2: CaseDocument = {
    documentId: 'doc-2',
    relation: 'ANEXO',
    addedAt: '2026-07-13T09:00:00Z', // Más temprano
    source: 'upload'
  };

  builder.setIdentifiers({ radicado: '11001-2026-0001' });
  builder.addDocument(doc1);
  builder.addDocument(doc2);
  builder.addDocument(doc1); // Duplicado, debería ignorarse

  const caso = builder.build();

  assert.strictEqual(caso.id, 'case-123');
  assert.strictEqual(caso.identifiers.radicado, '11001-2026-0001');
  assert.strictEqual(caso.documents.length, 2, 'Debería ignorar el documento duplicado');
  
  // Orden determinista por addedAt (doc2 es más temprano que doc1)
  assert.strictEqual(caso.documents[0].documentId, 'doc-2');
  assert.strictEqual(caso.documents[1].documentId, 'doc-1');
});
