import { Case } from '@lexia/domain';
import { CaseSummaryView } from '../contracts/CaseSummaryView.js';

export class CaseProjector {
  /**
   * Proyecta un Expediente (Case) en una vista resumida lista para la UI.
   * Totalmente libre de lógica de negocio o resolución de identidades.
   */
  public static project(caso: Case): CaseSummaryView {
    return {
      radicado: caso.identifiers.radicado || 'SIN RADICADO',
      documentsProcessed: caso.documents.length,
      participants: caso.participants.map(p => ({
        participantId: p.id,
        normalizedName: p.normalizedName,
        roles: p.roles?.map(r => r.roleName) || [],
        confidence: p.confidence,
        mentionCount: p.mentions?.length || 0
      })),
      observations: [] // Aquí se podrían añadir reportes de conflictos del Case si existieran
    };
  }
}
