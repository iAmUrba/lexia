import { CapabilityRoutingTable, RouteCondition } from './RoutingTable.js';
import { CapabilityId } from '../types/index.js';

export interface DAGNode {
  capabilityId: CapabilityId;
  dependencies: CapabilityId[]; // Capabilities que deben terminar antes que esta inicie
}

export interface ExecutionDAG {
  nodes: DAGNode[];
}

export class CapabilityPlanner<TState> {
  constructor(
    private routingTable: CapabilityRoutingTable,
    private conditionEvaluator: (state: TState, condition: RouteCondition) => boolean
  ) {}

  /**
   * Genera un Grafo Acíclico Dirigido (DAG) basado en el estado actual
   */
  plan(state: TState): ExecutionDAG {
    const nodes: DAGNode[] = [];

    // Por cada ruta, evaluamos si todas sus condiciones se cumplen en el estado actual
    for (const route of this.routingTable.getRoutes()) {
      const match = route.conditions.every(cond => this.conditionEvaluator(state, cond));
      
      if (match) {
        // Para simplificar esta versión, agregamos las capacidades sin dependencias entre sí (paralelas)
        // El verdadero cálculo de DAG evaluaría Precondiciones cruzadas de los Descriptores.
        for (const cap of route.targetCapabilities) {
          // Evitamos duplicados
          if (!nodes.find(n => n.capabilityId.value === cap.value)) {
            nodes.push({
              capabilityId: cap,
              dependencies: [] // Asumimos paralelo por ahora
            });
          }
        }
      }
    }

    return { nodes };
  }
}
