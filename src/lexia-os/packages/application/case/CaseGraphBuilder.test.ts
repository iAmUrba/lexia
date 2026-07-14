import test from 'node:test';
import assert from 'node:assert';
import { CaseGraphBuilder } from './CaseGraphBuilder.js';
import { Case } from '@lexia/domain';

test('CaseGraphBuilder - Deriva nodos y aristas a partir de Case', () => {
  const caso: Case = {
    id: 'case-1',
    identifiers: {},
    documents: [
      { documentId: 'doc-1', relation: 'PRINCIPAL', addedAt: '2026', source: 'src' }
    ],
    participants: [
      {
        id: 'p-1',
        normalizedName: 'Juan Perez',
        confidence: 'HIGH',
        mentions: [
          {
            mentionId: 'm-1',
            text: 'Juan',
            sourceDocumentId: 'doc-1',
            boundingBoxes: []
          }
        ]
      }
    ],
    timeline: {
      operations: [
        { timestamp: '2026', operation: 'Creation', executor: 'doc-1' }
      ]
    },
    events: []
  };

  const graph = CaseGraphBuilder.build(caso);

  // 1 Document, 1 Participant, 1 Event = 3 nodes
  assert.strictEqual(graph.nodes.length, 3);
  
  // 1 MENTIONED_IN, 1 GENERATES = 2 edges
  assert.strictEqual(graph.edges.length, 2);

  const mentionEdge = graph.edges.find(e => e.type === 'MENTIONED_IN');
  assert.ok(mentionEdge);
  assert.strictEqual(mentionEdge?.sourceId, 'p-1');
  assert.strictEqual(mentionEdge?.targetId, 'doc-1');
});
