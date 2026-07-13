import { CapabilityDescriptor, CapabilityContext, CapabilityInstance, CapabilityId } from '../../../../engine/index.js';
import { PlainTextAsset, ExtractionStatusAsset } from '../../../../domain/document/index.js';
import { DocumentStream } from '../../../../io/index.js';
import { Id } from '../../../../foundation/id/index.js';

class PdfTextCapability implements CapabilityInstance<DocumentStream, (PlainTextAsset | ExtractionStatusAsset)[]> {
  async execute(input: DocumentStream, context: CapabilityContext): Promise<(PlainTextAsset | ExtractionStatusAsset)[]> {
    // Aquí iría el parsing real de texto con pdf.js
    // Simulamos que descubrimos que es un PDF escaneado (sin texto)
    const hasText = false; 
    
    if (hasText) {
      const asset: PlainTextAsset = {
        assetId: { value: Id.generate().value },
        assetType: 'PlainText',
        version: 1,
        producer: CapabilityId.of('reader.pdf.text.v1'),
        producedAt: context.clock.timestamp(),
        confidence: { score: 95, origin: 'Deterministic' },
        text: 'Texto extraído',
        encoding: 'utf-8',
        language: 'es',
        pageCount: 1,
        source: 'PDF_Native'
      };
      return [asset];
    } else {
      // Si no tiene texto, en vez de llamar a OCR, declaramos el estado
      const status: ExtractionStatusAsset = {
        assetId: { value: Id.generate().value },
        assetType: 'ExtractionStatus',
        version: 1,
        producer: CapabilityId.of('reader.pdf.text.v1'),
        producedAt: context.clock.timestamp(),
        confidence: { score: 100, origin: 'Deterministic' },
        textAvailable: false,
        reason: 'Scanned Document or No Text Layer'
      };
      return [status];
    }
  }
}

export const pdfTextDescriptor: CapabilityDescriptor<DocumentStream, (PlainTextAsset | ExtractionStatusAsset)[]> = {
  id: CapabilityId.of('reader.pdf.text.v1'),
  version: '1.0.0',
  requirements: [],
  profile: {
    estimatedMemoryMB: 200, // Extraer texto de un PDF pesado consume memoria
    estimatedLatencyMs: 1500,
    estimatedCpuUsage: 'High',
    parallelizable: true,
    suggestedPriority: 'Normal'
  },
  preconditions: (input) => {
    return { valid: !!input };
  },
  postconditions: (output) => {
    return { valid: output && output.length > 0 };
  },
  createInstance: async () => new PdfTextCapability()
};
