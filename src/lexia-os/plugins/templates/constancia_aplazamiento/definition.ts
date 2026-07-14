import { DocumentDefinition, DocumentProjector, DocumentModel, Case } from '@lexia/domain';

class ConstanciaAplazamientoProjector implements DocumentProjector {
  project(caso: Case): DocumentModel {
    return {
      title: 'Constancia de Aplazamiento',
      fields: {
        radicado: caso.identifiers.radicado || 'SIN RADICADO',
        fecha: new Date().toLocaleDateString('es-CO')
      },
      sections: [],
      evidence: []
    };
  }
}

export const constanciaAplazamientoDefinition: DocumentDefinition = {
  id: 'constancia_aplazamiento_v1',
  name: 'Constancia de Aplazamiento',
  description: 'Se emite cuando una audiencia debe ser aplazada por inasistencia o fuerza mayor.',
  projector: new ConstanciaAplazamientoProjector()
};
