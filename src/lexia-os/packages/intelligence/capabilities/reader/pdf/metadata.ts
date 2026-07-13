import { CapabilityDescriptor, CapabilityContext, CapabilityInstance, CapabilityId } from '../../../../engine/index.js';
import { DocumentAsset } from '../../../../domain/document/index.js';
import { DocumentStream } from '../../../../io/index.js';
import { Id } from '../../../../foundation/id/index.js';

export interface MetadataAsset extends DocumentAsset {
  readonly assetType: 'Metadata';
  readonly author?: string;
  readonly title?: string;
  readonly creationDate?: number;
  readonly isEncrypted: boolean;
}

class PdfMetadataCapability implements CapabilityInstance<DocumentStream, MetadataAsset[]> {
  async execute(input: DocumentStream, context: CapabilityContext): Promise<MetadataAsset[]> {
    // Aquí iría el parsing real con pdf.js
    const asset: MetadataAsset = {
      assetId: { value: Id.generate().value },
      assetType: 'Metadata',
      version: 1,
      producer: CapabilityId.of('reader.pdf.metadata.v1'),
      producedAt: context.clock.timestamp(),
      confidence: { score: 100, origin: 'Deterministic' },
      isEncrypted: false,
      author: 'Unknown'
    };
    return [asset];
  }
}

export const pdfMetadataDescriptor: CapabilityDescriptor<DocumentStream, MetadataAsset[]> = {
  id: CapabilityId.of('reader.pdf.metadata.v1'),
  version: '1.0.0',
  requirements: [],
  profile: {
    estimatedMemoryMB: 50,
    estimatedLatencyMs: 200,
    estimatedCpuUsage: 'Low',
    parallelizable: true,
    suggestedPriority: 'Normal'
  },
  preconditions: (input) => {
    return { valid: !!input };
  },
  postconditions: (output) => {
    return { valid: output && output.length > 0 };
  },
  createInstance: async () => new PdfMetadataCapability()
};
