import { DocumentDefinition, DocumentProjector, DocumentModel, Case } from '@lexia/domain';

class ConstanciaAplazamientoProjector implements DocumentProjector {
  project(caso: Case): DocumentModel {
    return {
      title: 'Constancia de Aplazamiento',
      fields: [
        {
          id: 'header.radicado',
          value: caso.identifiers.radicado || 'SIN RADICADO',
          datatype: 'string',
          required: true,
          editable: false,
          evidence: [] // Aquí se extraerá la evidencia del caso en el futuro
        },
        {
          id: 'header.juzgado',
          value: 'JUZGADO PENAL DEL CIRCUITO',
          datatype: 'string',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'hearing.date',
          value: new Date().toLocaleDateString('es-CO'),
          datatype: 'date',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'hearing.type',
          value: 'Formulación de Imputación',
          datatype: 'string',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'hearing.reason',
          value: 'Inasistencia de la defensa',
          datatype: 'string',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'participants.judge',
          value: 'JUAN PEREZ (Juez)',
          datatype: 'string',
          required: true,
          editable: false,
          evidence: []
        },
        {
          id: 'participants.prosecutor',
          value: 'MARIA GOMEZ (Fiscal)',
          datatype: 'string',
          required: true,
          editable: false,
          evidence: []
        },
        {
          id: 'participants.secretary',
          value: 'CARLOS RAMIREZ (Secretario)',
          datatype: 'string',
          required: true,
          editable: false,
          evidence: []
        }
      ],
      sections: []
    };
  }
}

export const constanciaAplazamientoDefinition: DocumentDefinition = {
  id: 'constancia_aplazamiento_v1',
  name: 'Constancia de Aplazamiento',
  description: 'Se emite cuando una audiencia debe ser aplazada por inasistencia o fuerza mayor.',
  projector: new ConstanciaAplazamientoProjector()
};
