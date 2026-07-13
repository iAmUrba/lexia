import { Document, DocumentIndexAsset } from '@lexia/domain';
import { ParticipantsAsset } from '@lexia/domain/document/participants/models.js';
import { CaseSummaryView, ParticipantView } from '../contracts/CaseSummaryView.js';
import { CaseHeaderProjector } from './CaseHeaderProjector.js';

export class CaseSummaryProjector {
  constructor(private headerProjector: CaseHeaderProjector) {}

  project(document: Document): CaseSummaryView {
    const header = this.headerProjector.project(document);
    
    // Obtenemos el asset final de participantes
    const participantsAsset = document.assets.latest<ParticipantsAsset>('Participants');
    
    let participants: ParticipantView[] = [];
    let observations: string[] = [];

    if (participantsAsset) {
      participants = participantsAsset.participants.map(p => {
        // Encontrar los roles asignados a este participante
        const assignments = participantsAsset.assignments.filter(a => a.participantId === p.id);
        const roles = assignments.map(a => {
          const def = participantsAsset.roles.find(r => r.id === a.roleId);
          return def ? def.name : 'Desconocido';
        });

        // Contar cuántas menciones tiene en total (buscando en los links)
        const links = participantsAsset.links.filter(l => l.participantId === p.id);
        
        // Asignamos una confianza mínima o promedio de los enlaces
        const confidence = links.length > 0 
          ? links.reduce((sum, l) => sum + l.confidence, 0) / links.length 
          : 0;

        return {
          participantId: p.id,
          name: p.canonicalName,
          roles: Array.from(new Set(roles)), // Deduplicar nombres de roles
          mentionCount: links.length,
          confidence: Math.round(confidence)
        };
      });

      // Calcular algunas observaciones básicas
      const unresolvedLinks = participantsAsset.links.filter(l => l.strategy === 'UNKNOWN'); // Placeholder
      if (participants.length === 0) {
        observations.push('No se detectaron participantes en el documento.');
      }
    } else {
      observations.push('Análisis de participantes no completado o indisponible.');
    }

    // Agregar warnings del flujo (ej. errores de validación)
    if (document.executions) {
      const warnings = document.executions.flatMap(e => e.warnings);
      observations.push(...warnings);
    }

    return {
      header,
      documentsProcessed: 1, // Por ahora LexIA solo procesa 1 documento
      participants,
      timeline: document.timeline.operations,
      observations
    };
  }
}
