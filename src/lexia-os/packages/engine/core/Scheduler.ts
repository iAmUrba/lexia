import { CapabilityRegistry } from '../registry/index.js';
import { Executor, ExecutionOptions } from './Executor.js';
import { CapabilityContext } from '../contracts/index.js';
import { ExecutionResult } from '../types/index.js';

export class Scheduler {
  constructor(
    private registry: CapabilityRegistry,
    private executor: Executor
  ) {}

  /**
   * Encola y despacha la ejecución de un Capability
   * En el futuro, aquí se manejará concurrencia, prioridades basadas en ExecutionProfile, etc.
   */
  async dispatch<TInput, TOutput>(
    capabilityIdStr: string,
    input: TInput,
    contextBuilder: (operationId: string) => CapabilityContext,
    options?: ExecutionOptions
  ): Promise<ExecutionResult<TOutput>> {
    
    // 1. Obtener descriptor del Registry
    const descriptor = this.registry.get<TInput, TOutput>(capabilityIdStr);

    // 2. Aquí podría entrar el ExecutionPolicy (ej. Validar recursos, delegar a cluster, offline mode)
    // if (ExecutionPolicy.denies(descriptor.profile)) { ... }

    // 3. Ejecutar a través del Executor
    return this.executor.execute(descriptor, input, contextBuilder, options);
  }
}
