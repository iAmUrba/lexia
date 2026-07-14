import { DocumentDefinition, DocumentProjector, DocumentModel, Case } from '@lexia/domain';

class ConstanciaAplazamientoProjector implements DocumentProjector {
  project(caso: Case): DocumentModel {
    return {
      title: 'Constancia de Aplazamiento',
      fields: {
        header: {
          radicado: caso.identifiers.radicado || 'SIN RADICADO',
          juzgado: 'JUZGADO PENAL DEL CIRCUITO'
        },
        hearing: {
          date: new Date().toLocaleDateString('es-CO'),
          type: 'Formulación de Imputación',
          reason: 'Inasistencia de la defensa'
        },
        participants: {
          judge: 'JUAN PEREZ (Juez)',
          prosecutor: 'MARIA GOMEZ (Fiscal)',
          secretary: 'CARLOS RAMIREZ (Secretario)'
        }
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
