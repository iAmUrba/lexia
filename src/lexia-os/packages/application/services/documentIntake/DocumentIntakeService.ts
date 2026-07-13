import { Hash } from '../../../foundation/hash/index.js';
import { success, failure } from '../../../foundation/result/index.js';
import { Audit } from '../../../foundation/audit/index.js';
import { EventBus } from '../../../foundation/events/index.js';
import { Confidence } from '../../../foundation/confidence/index.js';
import { DocumentReceipt } from './DocumentReceipt.js';
import { Result, AuditSink, Actor, DocumentReceipt as IDocumentReceipt } from '../../../foundation/contracts/index.js';

export interface IntakeRequest {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  source: string;
  actor: Actor; // Quién sube el archivo
}

export class DocumentIntakeService {
  constructor(private auditSink: AuditSink) {}

  async process(request: IntakeRequest): Promise<Result<IDocumentReceipt>> {
    try {
      // 1. Generate Fingerprint
      const fingerprint = Hash.sha256(request.buffer);

      // 2. Generate Receipt (which auto-generates receiptId and timestamp)
      const receipt = DocumentReceipt.create({
        fingerprint,
        sizeBytes: request.buffer.length,
        mimeType: request.mimeType,
        originalName: request.originalName,
        source: request.source
      });

      // 3. Collect Metadata
      const metadata = {
        receiptId: receipt.receiptId,
        fingerprint: fingerprint.value,
        sizeBytes: request.buffer.length
      };

      // 4. Emit AuditRecord
      const audit = Audit.createRecord({
        actor: request.actor,
        action: 'DocumentIntake',
        target: receipt.receiptId,
        outcome: 'Success',
        confidence: Confidence.deterministic('Intake de archivo determinista'),
        aiUsed: false,
        service: 'DocumentIntakeService',
        correlationId: { value: receipt.receiptId }, // For intake, receiptId becomes the root correlationId
        metadata
      });
      await this.auditSink.record(audit);

      // 5. Publish Domain Event
      await EventBus.publish('DocumentIngested', {
        receipt,
        correlationId: audit.correlationId.value
      });

      // 6. Return Result
      return success(receipt);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
