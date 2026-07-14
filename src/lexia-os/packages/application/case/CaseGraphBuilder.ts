import { Case } from '@lexia/domain';

export interface CaseGraphNode {
  readonly id: string;
  readonly label: 'Participant' | 'Document' | 'Event';
  readonly properties: Record<string, any>;
}

export interface CaseGraphEdge {
  readonly sourceId: string;
  readonly targetId: string;
  readonly type: 'ACTS_IN' | 'MENTIONED_IN' | 'GENERATES' | 'BELONGS_TO';
}

export interface CaseGraph {
  readonly nodes: CaseGraphNode[];
  readonly edges: CaseGraphEdge[];
}

export class CaseGraphBuilder {
  /**
   * Construye un índice relacional derivado (Grafo en memoria) a partir del Case.
   */
  public static build(caso: Case): CaseGraph {
    const nodes: CaseGraphNode[] = [];
    const edges: CaseGraphEdge[] = [];

    // 1. Nodos de Documentos
    for (const doc of caso.documents) {
      nodes.push({
        id: doc.documentId,
        label: 'Document',
        properties: { relation: doc.relation, addedAt: doc.addedAt }
      });
    }

    // 2. Nodos de Participantes
    for (const participant of caso.participants) {
      nodes.push({
        id: participant.id,
        label: 'Participant',
        properties: { name: participant.normalizedName, roles: participant.roles }
      });

      // Como los participantes a nivel Case ya están consolidados,
      // sus mentions (evidencia) apuntan al Document original donde fueron extraídos.
      if (participant.mentions) {
        for (const mention of participant.mentions) {
          if (mention.sourceDocumentId) {
            edges.push({
              sourceId: participant.id,
              targetId: mention.sourceDocumentId,
              type: 'MENTIONED_IN'
            });
          }
        }
      }
    }

    // 3. Nodos de Timeline (Eventos procesales)
    let eventIndex = 0;
    for (const op of caso.timeline.operations) {
      const eventId = `event-${eventIndex++}`;
      nodes.push({
        id: eventId,
        label: 'Event',
        properties: { operation: op.operation, timestamp: op.timestamp }
      });

      if (op.executor) {
        // En este dominio, executor normalmente es el documentId o el actor
        edges.push({
          sourceId: op.executor,
          targetId: eventId,
          type: 'GENERATES'
        });
      }
    }

    return { nodes, edges };
  }
}
