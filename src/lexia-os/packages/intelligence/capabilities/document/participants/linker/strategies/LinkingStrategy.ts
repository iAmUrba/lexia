import { ParticipantCandidate, ParticipantLink } from '@lexia/domain';

/**
 * Contrato base para las estrategias de enlace de participantes.
 */
export interface LinkingStrategy {
  readonly id: string;
  readonly priority: number;
  
  /**
   * Intenta enlazar candidatos.
   * @param candidates Lista de candidatos actuales.
   * @returns Un arreglo de enlaces inferidos.
   */
  link(candidates: ParticipantCandidate[]): ParticipantLink[];
}
