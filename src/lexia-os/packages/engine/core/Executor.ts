import { CapabilityDescriptor, CapabilityContext } from '../contracts/index.js';
import { ExecutionResult } from '../types/index.js';
import { success, failure } from '../../foundation/result/index.js';
import { Id } from '../../foundation/id/index.js';

export interface ExecutionOptions {
  timeoutMs?: number;
  retries?: number;
}

export class Executor {
  /**
   * Ejecuta una capacidad de forma segura, manejando timeouts, precondiciones y auditoría básica
   */
  async execute<TInput, TOutput>(
    descriptor: CapabilityDescriptor<TInput, TOutput>,
    input: TInput,
    contextBuilder: (operationId: string) => CapabilityContext,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult<TOutput>> {
    
    const operationIdStr = Id.generate();
    const context = contextBuilder(operationIdStr);
    const startTime = context.clock.timestamp();

    // 1. Validar Precondiciones
    const preCheck = descriptor.preconditions(input);
    if (!preCheck.valid) {
      return {
        result: failure(new Error(`Precondición fallida: ${preCheck.reason || preCheck.code}`)),
        durationMs: context.clock.timestamp() - startTime,
        operationId: context.operationId,
        correlationId: context.correlationId,
        warnings: []
      };
    }

    try {
      // 2. Setup Timeout
      const timeoutMs = options.timeoutMs ?? 30000;
      const abortController = new AbortController();
      
      // Si el context ya trae un signal (ej. cancelación superior), nos encadenamos
      if (context.abortSignal) {
        context.abortSignal.addEventListener('abort', () => abortController.abort());
      }
      
      const timeoutId = setTimeout(() => abortController.abort('TIMEOUT'), timeoutMs);

      // Mutamos el contexto para inyectar nuestro AbortSignal (que combina el superior y el timeout local)
      const executionContext: CapabilityContext = {
        ...context,
        abortSignal: abortController.signal
      };

      context.trace.startSpan(`execute:${descriptor.id.toString()}`);

      // 3. Lazy Load e Instanciación
      const instance = await descriptor.createInstance();

      // 4. Ejecución Real (con soporte para timeout y promesas)
      const executionPromise = instance.execute(input, executionContext);
      
      // Promesa que rechaza si se aborta
      const abortPromise = new Promise<never>((_, reject) => {
        if (abortController.signal.aborted) {
          reject(new Error(abortController.signal.reason));
        }
        abortController.signal.addEventListener('abort', () => {
          reject(new Error(abortController.signal.reason));
        });
      });

      const output = await Promise.race([executionPromise, abortPromise]);
      clearTimeout(timeoutId);

      context.trace.endSpan();

      // 5. Validar Postcondiciones
      const postCheck = descriptor.postconditions(output);
      if (!postCheck.valid) {
        throw new Error(`Postcondición fallida: ${postCheck.reason || postCheck.code}`);
      }

      // 6. Auditoría y Evento Automático
      // El motor dispara eventos "CapabilityExecuted" automáticamente
      await context.events.publish('CapabilityExecuted', {
        capabilityId: descriptor.id.toString(),
        version: descriptor.version,
        operationId: context.operationId.value,
        correlationId: context.correlationId.value,
        durationMs: context.clock.timestamp() - startTime
      });

      return {
        result: success(output),
        durationMs: context.clock.timestamp() - startTime,
        operationId: context.operationId,
        correlationId: context.correlationId
      };

    } catch (err: any) {
      context.trace.endSpan();
      return {
        result: failure(err),
        durationMs: context.clock.timestamp() - startTime,
        operationId: context.operationId,
        correlationId: context.correlationId
      };
    }
  }
}
