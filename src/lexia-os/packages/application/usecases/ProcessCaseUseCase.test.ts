import test from 'node:test';
import assert from 'node:assert';
import { ProcessCaseUseCase } from './ProcessCaseUseCase.js';
import { CaseRepository } from '../contracts/CaseRepository.js';
import { Case, CaseId } from '@lexia/domain';
import { ProcessDocumentUseCase } from './ProcessDocumentUseCase.js';
import { Document, DocumentIndexAsset } from '@lexia/domain';

class InMemoryCaseRepository implements CaseRepository {
  private cases = new Map<string, Case>();

  async save(caso: Case): Promise<void> { this.cases.set(caso.id, caso); }
  async findById(id: CaseId): Promise<Case | null> { return this.cases.get(id) || null; }
  async findByRadicado(radicado: string): Promise<Case | null> { return null; }
  async findByParticipant(participantId: string): Promise<Case[]> { return []; }
  async findByDocument(documentId: string): Promise<Case | null> { return null; }
}

class MockProcessDocumentUseCase extends ProcessDocumentUseCase {
  constructor() {
    super({} as any, {} as any, {} as any);
  }

  async process(filePath: string, domain: 'judicial' | 'general' = 'judicial'): Promise<Document> {
    return {
      id: `doc-from-${filePath}`,
      source: filePath,
      assets: {
        all: () => [],
        latest: (type) => {
          if (type === 'DocumentIndex') {
            return { type: 'DocumentIndex', radicado: '11001-mock' } as any;
          }
          if (type === 'ParticipantsAsset') {
            return { type: 'ParticipantsAsset', participants: [
              { id: `p-${filePath}`, normalizedName: 'Juan', confidence: 'HIGH', mentions: [] }
            ] } as any;
          }
          return null;
        }
      },
      timeline: { operations: [{ timestamp: '2026', operation: 'Creation', executor: filePath }] }
    } as any;
  }
}

test('ProcessCaseUseCase - Integración E2E y ProcessCaseResult', async () => {
  const mockRepo = new InMemoryCaseRepository();
  const mockDocUseCase = new MockProcessDocumentUseCase();
  const useCase = new ProcessCaseUseCase(mockDocUseCase, mockRepo);

  const result = await useCase.execute(
    'case-xyz',
    { id: 'source-1', type: 'FOLDER', path: '/mocks' },
    ['file1.pdf', 'file2.pdf']
  );

  assert.strictEqual(result.caso.id, 'case-xyz');
  assert.strictEqual(result.reports.documentsProcessed, 2);
  
  // El primer Juan se crea, el segundo Juan se fusiona
  assert.strictEqual(result.reports.participants.created, 1);
  assert.strictEqual(result.reports.participants.merged, 1);
  
  // Debe tener un timeline consolidado (1 evento por documento = 2)
  assert.strictEqual(result.reports.timeline.merged, 2);

  // El grafo debe contener los 2 docs + 1 participante + 2 eventos = 5 nodos
  assert.strictEqual(result.graph.nodes.length, 5);

  // El summary debe tener los participantes
  assert.strictEqual(result.summary.participants.length, 1);
});
