import { Case, CaseId } from '@lexia/domain';

export interface CaseRepository {
  /**
   * Guarda o actualiza un expediente.
   */
  save(caso: Case): Promise<void>;

  /**
   * Busca un expediente por su ID técnico.
   */
  findById(id: CaseId): Promise<Case | null>;

  /**
   * Busca un expediente por su radicado judicial.
   */
  findByRadicado(radicado: string): Promise<Case | null>;

  /**
   * Busca expedientes que contienen a un participante específico.
   */
  findByParticipant(participantId: string): Promise<Case[]>;

  /**
   * Busca el expediente que contiene un documento específico.
   */
  findByDocument(documentId: string): Promise<Case | null>;
}
