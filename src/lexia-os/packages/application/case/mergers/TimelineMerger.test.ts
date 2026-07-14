import test from 'node:test';
import assert from 'node:assert';
import { TimelineMerger } from './TimelineMerger.js';
import { Timeline, TimelineOperation } from '@lexia/domain';

test('TimelineMerger - Orden cronológico estricto y determinista', () => {
  const op1: TimelineOperation = {
    timestamp: '2026-07-13T10:00:00Z',
    operation: 'Extraction',
    executor: 'doc-B'
  };

  const op2: TimelineOperation = {
    timestamp: '2026-07-13T09:00:00Z',
    operation: 'Extraction',
    executor: 'doc-A'
  };

  const op3: TimelineOperation = {
    timestamp: '2026-07-13T10:00:00Z',
    operation: 'Linker',
    executor: 'doc-C'
  };

  const t1: Timeline = { operations: [op1] };
  const t2: Timeline = { operations: [op2, op3] };

  const { timeline, report } = TimelineMerger.merge([t1, t2], {
    strategy: 'DATE_THEN_TIMESTAMP',
    tiebreaker: 'DOCUMENT_ID'
  });

  assert.strictEqual(timeline.operations.length, 3);
  assert.strictEqual(report.merged, 3);
  
  // Doc A es el más temprano
  assert.strictEqual(timeline.operations[0].executor, 'doc-A');
  
  // Doc B vs Doc C (Mismo timestamp, Doc B es menor lexicográficamente)
  assert.strictEqual(timeline.operations[1].executor, 'doc-B');
  assert.strictEqual(timeline.operations[2].executor, 'doc-C');
});
