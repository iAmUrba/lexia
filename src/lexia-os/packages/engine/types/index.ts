import { Result, ConfidenceScore, OperationId, CorrelationId } from '../../foundation/contracts/index.js';

// 1. Validation Result para pre/post conditions
export type ValidationResult = 
  | { valid: true }
  | { valid: false; reason?: string; code?: string };

// 2. Requirements (Value Objects)
export type Requirement = 
  | 'LocalLLM'
  | 'CloudLLM'
  | 'OCR'
  | 'GPU'
  | 'Internet'
  | 'Filesystem'
  | 'Database';

// 3. Execution Profile (Reemplazo de cost)
export interface ExecutionProfile {
  readonly estimatedMemoryMB: number;
  readonly estimatedLatencyMs: number;
  readonly estimatedCpuUsage: 'Low' | 'Medium' | 'High';
  readonly estimatedTokens?: number;
  readonly parallelizable: boolean;
  readonly suggestedPriority: 'Low' | 'Normal' | 'High' | 'Critical';
}

// 4. CapabilityId (Value Object tipado)
export class CapabilityId {
  private constructor(public readonly value: string) {}

  static of(value: string): CapabilityId {
    // Validar formato estricto (ej. "reader.extract-text.v1")
    const regex = /^[a-z0-9]+(\.[a-z0-9-]+)+$/;
    if (!regex.test(value)) {
      throw new Error(`Formato de CapabilityId inválido: ${value}. Debe seguir el formato "dominio.accion[.version]"`);
    }
    return new CapabilityId(value);
  }

  toString(): string {
    return this.value;
  }
}

export interface ExecutionResult<T> {
  readonly result: Result<T>;
  readonly durationMs: number;
  readonly confidence?: ConfidenceScore;
  readonly operationId: OperationId;
  readonly correlationId: CorrelationId;
  readonly warnings?: string[];
}

// 6. Observability (Execution Metrics)
export interface CapabilityMetrics {
  readonly capabilityId: string;
  readonly startedAt: number;
  readonly finishedAt: number;
  readonly durationMs: number;
  readonly assetsProduced: string[];
  readonly warnings: string[];
  readonly errors: string[];
  readonly status: 'SUCCESS' | 'ERROR' | 'SKIPPED';
  readonly retries: number;
}

export interface ExecutionReport {
  readonly startedAt: number;
  readonly finishedAt: number;
  readonly totalDurationMs: number;
  readonly peakMemoryMB?: number;
  readonly summary?: string;
  readonly capabilities: CapabilityMetrics[];
}
