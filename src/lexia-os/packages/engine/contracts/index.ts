import { CorrelationId, OperationId, AuditSink } from '../../foundation/contracts/index.js';
import { CapabilityId, Requirement, ExecutionProfile, ValidationResult } from '../types/index.js';

// Mocks o tipos abstractos para los servicios del entorno (pueden ser reemplazados luego por contratos reales)
export interface ClockType {
  timestamp(): number;
}
export interface LoggerType {
  info(msg: string): void;
  error(msg: string, err?: any): void;
}
export interface EventBusType {
  publish(eventName: string, payload: any): Promise<void>;
}
export interface ConfigType {
  get(key: string): any;
}
export interface MetricsType {
  record(metric: string, value: number): void;
}
export interface TraceType {
  startSpan(name: string): void;
  endSpan(): void;
}
export interface RuntimeMetricsProvider {
  getPeakMemoryMB(): number | undefined;
  now(): number;
}

// 1. Capability Context (Inyección de dependencias para procesos cognitivos)
export interface CapabilityContext {
  readonly abortSignal: AbortSignal;
  readonly correlationId: CorrelationId;
  readonly operationId: OperationId;
  readonly clock: ClockType;
  readonly logger: LoggerType;
  readonly audit: AuditSink;
  readonly events: EventBusType;
  readonly config: ConfigType;
  readonly metrics: MetricsType;
  readonly trace: TraceType;
  readonly runtime?: RuntimeMetricsProvider;
}

// 2. Capability Instance (La ejecución real)
export interface CapabilityInstance<TInput, TOutput> {
  execute(input: TInput, context: CapabilityContext): Promise<TOutput>;
}

// 3. Capability Descriptor (El registro)
export interface CapabilityDescriptor<TInput, TOutput> {
  readonly id: CapabilityId;
  readonly version: string;
  readonly requirements: Requirement[];
  readonly profile: ExecutionProfile;
  readonly preconditions: (input: TInput) => ValidationResult;
  readonly postconditions: (output: TOutput) => ValidationResult;
  readonly createInstance: () => Promise<CapabilityInstance<TInput, TOutput>>;
}
