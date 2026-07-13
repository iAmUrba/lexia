import { CapabilityDescriptor, CapabilityContext, CapabilityInstance, CapabilityId } from '../../../../engine/index.js';
import { MimeTypeAsset } from '../../../../domain/document/index.js';
import { DocumentStream } from '../../../../io/index.js';
import { Id } from '../../../../foundation/id/index.js';

class DocumentIdentifyCapability implements CapabilityInstance<DocumentStream, MimeTypeAsset[]> {
  async execute(input: DocumentStream, context: CapabilityContext): Promise<MimeTypeAsset[]> {
    // Leemos los magic bytes (primeros 4 bytes por ejemplo)
    const chunk = await input.readChunk(0, 4);
    const hex = chunk.toString('hex').toUpperCase();

    let mimeType = 'application/octet-stream';
    let extension = 'bin';

    if (hex.startsWith('25504446')) {
      mimeType = 'application/pdf';
      extension = 'pdf';
    } else if (hex.startsWith('89504E47')) {
      mimeType = 'image/png';
      extension = 'png';
    } else if (hex.startsWith('504B0304')) {
      mimeType = 'application/zip';
      extension = 'zip'; // Docx is also a zip, need deep inspection, but simplified for now
    }

    const asset: MimeTypeAsset = {
      assetId: { value: Id.generate().value },
      assetType: 'MimeType',
      version: 1, // Snapshot version is arbitrary, Assembler fixes it
      producer: CapabilityId.of('document.identify.v1'),
      producedAt: context.clock.timestamp(),
      confidence: { score: 99, origin: 'Deterministic' },
      mimeType,
      extension
    };

    return [asset];
  }
}

export const documentIdentifyDescriptor: CapabilityDescriptor<DocumentStream, MimeTypeAsset[]> = {
  id: CapabilityId.of('document.identify.v1'),
  version: '1.0.0',
  requirements: [],
  profile: {
    estimatedMemoryMB: 10,
    estimatedLatencyMs: 5,
    estimatedCpuUsage: 'Low',
    parallelizable: true,
    suggestedPriority: 'High' // Identificación rápida
  },
  preconditions: (input) => {
    if (!input || !input.source) return { valid: false, reason: 'Invalid DocumentStream' };
    return { valid: true };
  },
  postconditions: (output) => {
    if (!output || output.length === 0) return { valid: false, reason: 'Missing MimeTypeAsset' };
    return { valid: true };
  },
  createInstance: async () => new DocumentIdentifyCapability()
};
