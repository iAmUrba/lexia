// ==========================================
// LEXIA PLATFORM CORE: ABI (Contracts)
// ==========================================

// 1. Result (Discriminated Union)
export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

// 2. Confidence
export type ConfidenceOrigin = 'Deterministic' | 'Regex' | 'OCR' | 'LLM' | 'Human' | 'Combined';

export interface ConfidenceScore {
  readonly score: number;
  readonly origin: ConfidenceOrigin;
  readonly explanation?: string;
}

// 3. FileFingerprint
export interface FileFingerprint {
  readonly algorithm: string; // 'sha256', 'sha512', 'blake3'
  readonly value: string;
  readonly createdAt: number;
}

// 4. Identity & Correlation
export type ActorType = 'System' | 'Human' | 'Service' | 'Scheduler';

export interface Actor {
  readonly type: ActorType;
  readonly identifier: string;
}

export interface CorrelationId {
  readonly value: string;
}

export interface OperationId {
  readonly value: string;
}

// 5. Audit
export interface AuditRecord {
  readonly version: '1'; // Control de versionado a futuro
  readonly auditId: string;
  readonly timestamp: number;
  readonly actor: Actor;
  readonly action: string;
  readonly target: string;
  readonly outcome: 'Success' | 'Failure' | 'Pending';
  readonly confidence: ConfidenceScore;
  readonly aiUsed: boolean;
  readonly service: string;
  readonly correlationId: CorrelationId;
  readonly operationId?: OperationId;
  readonly metadata?: Record<string, any>;
}

export interface AuditSink {
  record(audit: AuditRecord): Promise<void>;
}

// 6. Domain Events
export interface DomainEvent {
  readonly id: string;
  readonly occurredAt: number;
  readonly name: string;
  readonly version: string;
  readonly payload: Record<string, any>;
}

// 7. Receipts
export interface DocumentReceipt {
  readonly receiptId: string;
  readonly fingerprint: FileFingerprint;
  readonly receivedAt: number;
  readonly sizeBytes: number;
  readonly mimeType: string;
  readonly originalName: string;
  readonly source: string;
}
