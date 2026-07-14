import { Timeline, TimelineMergePolicy, MergeReport, TimelineOperation } from '@lexia/domain';

export class TimelineMerger {
  /**
   * Fusiona inmutablemente múltiples timelines en uno solo maestro de manera determinista.
   */
  public static merge(
    timelines: Timeline[],
    policy: TimelineMergePolicy
  ): { timeline: Timeline; report: MergeReport } {
    const startTime = Date.now();
    let mergedCount = 0;
    
    // Extraer todas las operaciones de todos los timelines
    const allOperations: TimelineOperation[] = [];
    for (const t of timelines) {
      allOperations.push(...t.operations);
    }
    
    // Sort determinista
    allOperations.sort((a, b) => {
      // 1. Desempate por timestamp (siempre lo tenemos en ISO)
      const timeDiff = a.timestamp.localeCompare(b.timestamp);
      if (timeDiff !== 0) return timeDiff;

      // 2. Si es necesario según política, desempatar por executor (u otra propiedad si hubiese documentId).
      // Como las operaciones actuales no guardan explícitamente originDocument, usamos executor/capability
      if (policy.tiebreaker === 'DOCUMENT_ID') {
        const executorA = a.executor || '';
        const executorB = b.executor || '';
        const execDiff = executorA.localeCompare(executorB);
        if (execDiff !== 0) return execDiff;
      }
      
      // 3. Estabilidad en base al tipo de operación
      return a.operation.localeCompare(b.operation);
    });

    mergedCount = allOperations.length;

    const report: MergeReport = {
      merged: mergedCount,
      created: 0,
      ignored: 0,
      conflicts: 0,
      durationMs: Date.now() - startTime
    };

    return {
      timeline: { operations: allOperations },
      report
    };
  }
}
