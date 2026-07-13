import { DocumentSource } from '@lexia/io';
import { DocumentIntakeService } from '../services/documentIntake/DocumentIntakeService.js';
import { CognitivePlanner } from '@lexia/intelligence';
import { GetCaseHeader } from '../queries/GetCaseHeader.js';
import { ProcessDocumentResult } from '../contracts/ProcessDocumentResult.js';
import { CaseSummaryProjector } from '../projectors/CaseSummaryProjector.js';
import { AssetCollectionImpl } from '@lexia/domain/document/index.js';

export class ProcessDocumentUseCase {
  constructor(
    private intake: DocumentIntakeService,
    private planner: CognitivePlanner,
    private getCaseHeader: GetCaseHeader,
    private caseSummaryProjector: CaseSummaryProjector
  ) {}

  async execute(source: any): Promise<ProcessDocumentResult> {
    // 1. Intake: Create the initial Document from the Source
    const document: any = {
      identity: { id: source.fingerprint, checksum: source.fingerprint, checksumAlgorithm: 'sha256' },
      provenance: { sourceUri: source.pathOrUri, timestamp: source.receivedAt, origin: source.origin },
      assets: new AssetCollectionImpl([]),
      timeline: {
        operations: [{
          operation: 'Intake Completed',
          timestamp: Date.now(),
          actor: 'ProcessDocumentUseCase'
        }]
      },
      executions: []
    };
    
    // Add implicit assets
    const mimeAsset = {
      assetId: 'mime-1',
      type: 'MimeType',
      mimeType: source.mimeType || 'application/pdf',
      confidence: { score: 1.0, isDeterministic: true, reason: 'Intake' }
    };
    const metaAsset = {
      assetId: 'meta-1',
      type: 'Metadata',
      metadata: { originalName: source.fingerprint, sizeBytes: source.byteSize },
      confidence: { score: 1.0, isDeterministic: true, reason: 'Intake' }
    };
    document.assets = new AssetCollectionImpl([mimeAsset, metaAsset] as any[]);
    
    // The stream must implement DocumentStream interface for the Reader capability
    const stream = source.buffer ? {
      readAllAsBuffer: async () => source.buffer
    } : null;
    
    // 2. Planner: Run capabilities until Document is ready
    // We pass a dummy context for now, but we'll try to extract peak memory if running in Node
    const context = {
      clock: { timestamp: () => Date.now() } as any,
      logger: { info: () => {}, error: () => {}, debug: () => {}, warn: () => {} },
      audit: { log: () => {}, record: async () => {} } as any,
      events: { publish: async () => {} } as any,
      trace: { startSpan: () => {}, endSpan: () => {}, emitEvent: () => {} } as any,
      operationId: { value: 'op-process-doc' },
      correlationId: { value: 'corr-process-doc' },
      runtime: {
        now: () => Date.now(),
        getPeakMemoryMB: () => {
          try {
            // Only works in Node environments, safe fallback for browser
            return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
          } catch (e) {
            return undefined;
          }
        }
      }
    };
    
    const { document: finalDocument, metrics } = await this.planner.execute(document, context as any, stream);
    
    // 3. Projections: Get CaseHeader and ValidationReport
    const { view: caseHeader, validation } = this.getCaseHeader.execute(finalDocument);
    const caseSummary = this.caseSummaryProjector.project(finalDocument);

    return {
      document: finalDocument,
      caseHeader,
      caseSummary,
      validation,
      metrics
    };
  }
}
