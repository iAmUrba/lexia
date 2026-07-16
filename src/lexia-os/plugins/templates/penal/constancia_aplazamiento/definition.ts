import { DocumentDefinition, DocumentProjector, DocumentModel, Case } from '@lexia/domain';

class ConstanciaAplazamientoProjector implements DocumentProjector {
  project(caso: Case): DocumentModel {
    return {
      title: 'Constancia de Aplazamiento',
      fields: [
        {
          id: 'fechaAudienciaTexto',
          value: 'dieciséis (16) de octubre de 2025',
          datatype: 'string',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'horaAudienciaTexto',
          value: '02:00 de la tarde',
          datatype: 'string',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'tipoAudiencia',
          value: 'AUDIENCIA DE JUICIO ORAL',
          datatype: 'string',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'radicado',
          value: caso.identifiers.radicado || '19001600060220210034100',
          datatype: 'string',
          required: true,
          editable: false,
          evidence: []
        },
        {
          id: 'procesadoNombre',
          value: 'EDINSON CAVIEDES MARTINEZ',
          datatype: 'string',
          required: true,
          editable: false,
          evidence: []
        },
        {
          id: 'procesadoId',
          value: '1.072.423.774',
          datatype: 'string',
          required: true,
          editable: false,
          evidence: []
        },
        {
          id: 'delitos',
          value: 'FABRICACIÓN, TRÁFICO O PORTE DE ARMAS, MUNICIONES DE USO RESTINGIDO, DE USO PRIVATIVO DE LAS FUERZAS ARMADAS O EXPLOSIVOS Y FABRICACIÓN, TRÁFICO, PORTE O TENENCIA DE ARMAS DE FUEGO, ACCESORIOS, PARTES O MUNICIONES',
          datatype: 'string',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'solicitanteCargo',
          value: 'Fiscal 5 Especializado (E)',
          datatype: 'string',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'solicitanteNombre',
          value: 'Dr. ÓSCAR EDUARDO CASTRILLON',
          datatype: 'string',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'motivoAplazamiento',
          value: 'la presente diligencia se cruza con audiencia programada en el despacho del cual es titular Fiscalía 6 Especializada',
          datatype: 'string',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'fechaFirmaTexto',
          value: 'dieciséis (16) del mes de octubre de dos mil veinticinco (2025)',
          datatype: 'string',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'firmaNombre',
          value: 'JUAN DAVID RAMOS RAMÍREZ',
          datatype: 'string',
          required: true,
          editable: true,
          evidence: []
        },
        {
          id: 'firmaCargo',
          value: 'AUXILIAR JUDICIAL',
          datatype: 'string',
          required: true,
          editable: true,
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
