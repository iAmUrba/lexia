import test from 'node:test';
import assert from 'node:assert';
import { ParticipantMerger } from './ParticipantMerger.js';
import { Participant } from '@lexia/domain';

test('ParticipantMerger - Fusión y detección de conflictos', () => {
  const existing: Participant[] = [
    {
      id: 'p-1',
      normalizedName: 'Juan Perez',
      confidence: 'HIGH',
      mentions: []
    }
  ];

  const incoming: Participant[] = [
    {
      id: 'p-2',
      normalizedName: 'Juan Perez',
      confidence: 'HIGH',
      mentions: []
    },
    {
      id: 'p-3',
      normalizedName: 'Juan Perez Gomez', // Conflicto: similitud
      confidence: 'MEDIUM',
      mentions: []
    },
    {
      id: 'p-4',
      normalizedName: 'Maria Rodriguez', // Nuevo
      confidence: 'HIGH',
      mentions: []
    }
  ];

  const result = ParticipantMerger.merge(existing, incoming);

  assert.strictEqual(result.report.merged, 1, 'Debería fusionar exactamente 1 participante (Juan Perez)');
  assert.strictEqual(result.report.created, 1, 'Debería crear 1 participante nuevo (Maria Rodriguez)');
  assert.strictEqual(result.report.conflicts, 1, 'Debería detectar 1 conflicto (Juan Perez Gomez vs Juan Perez)');
  
  assert.strictEqual(result.participants.length, 2, 'Total de participantes unificados debería ser 2 (Juan Perez y Maria Rodriguez)');
  
  const conflict = result.unresolvedConflicts[0];
  assert.strictEqual(conflict.type, 'LOW_CONFIDENCE');
  assert.strictEqual(conflict.incomingParticipantId, 'p-3');
  assert.strictEqual(conflict.existingParticipantId, 'p-1');
});
