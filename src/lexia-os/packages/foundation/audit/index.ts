import { Id } from '../id/index.js';
import { Clock } from '../clock/index.js';
import { AuditRecord, AuditSink, AuditRecordPayload } from '../contracts/index.js';

export const Audit = {
  createRecord(payload: Omit<AuditRecordPayload, 'auditId' | 'timestamp' | 'version'>): AuditRecord {
    return Object.freeze({
      version: '1' as const,
      auditId: Id.generate(),
      timestamp: Clock.timestamp(),
      actor: payload.actor,
      action: payload.action,
      target: payload.target,
      outcome: payload.outcome,
      confidence: payload.confidence,
      aiUsed: payload.aiUsed,
      service: payload.service,
      correlationId: payload.correlationId,
      operationId: payload.operationId,
      metadata: payload.metadata
    });
  }
};

export type { AuditSink };
