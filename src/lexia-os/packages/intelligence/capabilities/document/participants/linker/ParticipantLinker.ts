import { ParticipantCandidate, ParticipantLink } from '@lexia/domain';
import { LinkingStrategy } from './strategies/LinkingStrategy.js';

export class ParticipantLinker {
  private readonly strategies: LinkingStrategy[];

  constructor(strategies: LinkingStrategy[]) {
    // Ordenar estrategias por prioridad
    this.strategies = [...strategies].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Ejecuta el proceso de Entity Linking sin modificar ni eliminar las menciones.
   * Aplica las estrategias en orden de prioridad.
   */
  link(candidates: ParticipantCandidate[]): ParticipantLink[] {
    const allLinks: ParticipantLink[] = [];

    // Hacemos una copia para ir marcando los que ya fueron procesados
    let pendingCandidates = [...candidates];

    for (const strategy of this.strategies) {
      if (pendingCandidates.length === 0) break;

      const newLinks = strategy.link(pendingCandidates);
      
      if (newLinks.length > 0) {
        allLinks.push(...newLinks);
        
        // Retiramos los candidatos que ya fueron exitosamente vinculados
        // (En una implementación real, aquí revisaríamos los conflicts y resoluciones)
        const linkedMentionIds = new Set(newLinks.map(l => l.mentionId));
        pendingCandidates = pendingCandidates.filter(c => {
          // Si el candidato tiene TODAS sus menciones ya vinculadas, lo retiramos
          return !c.mentions.every(m => linkedMentionIds.has(m.id));
        });
      }
    }

    return allLinks;
  }
}
