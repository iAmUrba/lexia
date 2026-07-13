import test from 'node:test';
import assert from 'node:assert';
import { ProcessCaseUseCase } from './ProcessCaseUseCase.js';
import { CaseRepository } from '../contracts/CaseRepository.js';
import { Case, CaseId } from '@lexia/domain';
import { ProcessDocumentUseCase } from './ProcessDocumentUseCase.js';
import { Document, DocumentIndexAsset } from '@lexia/domain';

// Mock simple de CaseRepository en memoria
class InMemoryCaseRepository implements CaseRepository {
  private cases = new Map<string, Case>();

  async save(caso: Case): Promise<void> {
    this.cases.set(caso.id, caso);
  }
  async findById(id: CaseId): Promise<Case | null> { return this.cases.get(id) || null; }
  async findByRadicado(radicado: string): Promise<Case | null> { return null; }
  async findByParticipant(participantId: string): Promise<Case[]> { return []; }
  async findByDocument(documentId: string): Promise<Case | null> { return null; }
}

// Mock simple de ProcessDocumentUseCase
class MockProcessDocumentUseCase extends ProcessDocumentUseCase {
  constructor() {
    super({} as any, {} as any, {} as any); // dependencias en mock
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
          return null;
        }
      },
      timeline: { operations: [] }
    } as any;
  }
}

test('ProcessCaseUseCase - Orquestación de expediente', async () => {
  const mockRepo = new InMemoryCaseRepository();
  const mockDocUseCase = new MockProcessDocumentUseCase();
  const useCase = new ProcessCaseUseCase(mockDocUseCase, mockRepo);

  const { caso, report } = await useCase.execute(
    'case-xyz',
    { id: 'source-1', type: 'FOLDER', path: '/mocks' },
    ['file1.pdf', 'file2.pdf']
  );

  assert.strictEqual(caso.id, 'case-xyz');
  assert.strictEqual(caso.identifiers.radicado, '11001-mock');
  assert.strictEqual(caso.documents.length, 2);
  
  assert.strictEqual(report.documentsProcessed, 2);
  assert.strictEqual(report.warnings.length, 0);

  const saved = await mockRepo.findById('case-xyz');
  assert.ok(saved);
  assert.strictEqual(saved?.documents.length, 2);
});
