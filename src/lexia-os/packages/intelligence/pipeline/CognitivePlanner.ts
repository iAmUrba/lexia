import { Document, DocumentStateEvaluator } from '@lexia/domain';
import { CapabilityContext, CapabilityRegistry, ExecutionReport, CapabilityMetrics, Executor } from '@lexia/engine';
import { CapabilityPlanner } from '@lexia/engine';
import { DocumentAssembler } from '@lexia/domain/document/index.js';

export class CognitivePlanner {
  constructor(
    private planner: CapabilityPlanner<any>,
    private registry: CapabilityRegistry,
    private executor: Executor,
    private assembler: DocumentAssembler,
    private evaluator: DocumentStateEvaluator
  ) {}

  async execute(document: Document, context: CapabilityContext, stream?: any): Promise<{ document: Document, metrics: ExecutionReport }> {
    const startGlobal = context.runtime ? context.runtime.now() : Date.now();
    const metricsList: CapabilityMetrics[] = [];
    let currentDocument = document;
    let state = this.evaluator.evaluate(currentDocument);

    // Loop until we don't have missing capabilities or we reach a safe max iterations
    let iterations = 0;
    while (state.missingCapabilities.length > 0 && iterations < 10) {
      iterations++;
      const plan = this.planner.plan(state);
      
      if (plan.nodes.length === 0) {
        break; // No capacities available to resolve the current missing capabilities
      }

      // Execute all nodes in parallel (assuming parallelizable for now)
      const executionPromises = plan.nodes.map(async node => {
        const descriptor = this.registry.get(node.capabilityId);
        if (!descriptor) throw new Error(`Capability no encontrada: ${node.capabilityId.value}`);
        
        const capStartTime = context.runtime ? context.runtime.now() : Date.now();
        // The input is stream for PDF Reader, or document for Indexer
        // In a real generic system, the planner route would specify what input to pass, 
        // but for now we pass stream if it's pdf, otherwise currentDocument
        const input = node.capabilityId.value.includes('reader.pdf') ? stream : currentDocument;
        
        const execResult = await this.executor.execute(descriptor, input, (opId) => ({ ...context, operationId: { value: opId } }));
        const capEndTime = context.runtime ? context.runtime.now() : Date.now();
        
        const assetsProduced: string[] = [];
        let success = false;
        if (execResult.result.ok) {
          success = true;
          const assets = execResult.result.value as any[];
          const snapshot = {
            producer: descriptor.id,
            operationId: execResult.operationId,
            correlationId: execResult.correlationId,
            durationMs: execResult.durationMs,
            startedAt: capStartTime,
            finishedAt: capEndTime,
            warnings: execResult.warnings,
            assets
          };
          // Assembly happens sequentially or carefully
          currentDocument = this.assembler.applySnapshot(currentDocument, snapshot);
          assetsProduced.push(...assets.map(a => a.type));
        }

        metricsList.push({
          capabilityId: node.capabilityId.value,
          startedAt: capStartTime,
          finishedAt: capEndTime,
          durationMs: execResult.durationMs,
          assetsProduced,
          warnings: execResult.warnings || [],
          errors: success ? [] : [(execResult.result as any).error?.message || 'Error'],
          status: success ? 'SUCCESS' : 'ERROR',
          retries: 0
        });
      });

      // Wait for parallel execution to finish for this layer
      await Promise.all(executionPromises);

      // Re-evaluate state
      state = this.evaluator.evaluate(currentDocument);
    }

    const endGlobal = context.runtime ? context.runtime.now() : Date.now();
    const totalDuration = endGlobal - startGlobal;
    const peakMem = context.runtime?.getPeakMemoryMB();

    return {
      document: currentDocument,
      metrics: {
        startedAt: startGlobal,
        finishedAt: endGlobal,
        totalDurationMs: totalDuration,
        peakMemoryMB: peakMem,
        capabilities: metricsList
      }
    };
  }
}
