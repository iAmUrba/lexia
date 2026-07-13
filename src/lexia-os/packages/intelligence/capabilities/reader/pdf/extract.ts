import { CapabilityDescriptor, CapabilityContext, CapabilityInstance, CapabilityId } from '../../../../engine/index.js';
import { MetadataAsset, PlainTextAsset, ExtractionStatusAsset, ExtractionQualityAsset, WarningCode, ExtractionMethod } from '../../../../domain/document/index.js';
import { DocumentStream } from '../../../../io/index.js';
import { Id } from '../../../../foundation/id/index.js';
import { PdfExtractor } from '../../../../adapters/pdf/index.js';

export type PdfExtractOutput = (MetadataAsset | PlainTextAsset | ExtractionStatusAsset | ExtractionQualityAsset)[];

class PdfExtractCapability implements CapabilityInstance<DocumentStream, PdfExtractOutput> {
  constructor(private readonly pdfExtractor: PdfExtractor) {}

  async execute(input: DocumentStream, context: CapabilityContext): Promise<PdfExtractOutput> {
    const buffer = await input.readAllAsBuffer();
    
    // El Adapter se encarga de aislar la librería (pdf.js / pdf-parse)
    const data = await this.pdfExtractor.extract(buffer);
    
    const assets: PdfExtractOutput = [];
    const timestamp = context.clock.timestamp();
    const warnings: WarningCode[] = [];

    if (data.isEncrypted) warnings.push('ENCRYPTED');

    // 1. Siempre se intenta generar un MetadataAsset
    const metadataAsset: MetadataAsset = {
      assetId: { value: Id.generate().value },
      assetType: 'Metadata',
      version: 1,
      producer: CapabilityId.of('reader.pdf.extract.v1'),
      producedAt: timestamp,
      confidence: { score: 100, origin: 'Deterministic' },
      isEncrypted: data.isEncrypted,
      author: data.metadata.author,
      title: data.metadata.title
    };
    assets.push(metadataAsset);

    // 2. Procesamos el texto
    const textStr = data.text.trim();
    const charCount = textStr.length;
    const pages = Math.max(1, data.numpages);
    const charsPerPage = Math.floor(charCount / pages);

    if (charCount < 50) {
      warnings.push('LOW_TEXT');
    }

    if (charsPerPage > 0) {
      const textAsset: PlainTextAsset = {
        assetId: { value: Id.generate().value },
        assetType: 'PlainText',
        version: 1,
        producer: CapabilityId.of('reader.pdf.extract.v1'),
        producedAt: timestamp,
        confidence: { score: 95, origin: 'Deterministic' },
        text: textStr,
        encoding: 'utf-8',
        language: 'unknown',
        pageCount: pages,
        source: 'PDF_Native'
      };
      assets.push(textAsset);
    } else {
      warnings.push('IMAGE_ONLY');
      const statusAsset: ExtractionStatusAsset = {
        assetId: { value: Id.generate().value },
        assetType: 'ExtractionStatus',
        version: 1,
        producer: CapabilityId.of('reader.pdf.extract.v1'),
        producedAt: timestamp,
        confidence: { score: 100, origin: 'Deterministic' },
        textAvailable: false,
        reason: 'No native text layer found or document is scanned.'
      };
      assets.push(statusAsset);
    }

    // 3. Generar ExtractionQualityAsset
    const qualityAsset: ExtractionQualityAsset = {
      assetId: { value: Id.generate().value },
      assetType: 'ExtractionQuality',
      version: 1,
      producer: CapabilityId.of('reader.pdf.extract.v1'),
      producedAt: timestamp,
      confidence: { score: 100, origin: 'Deterministic' },
      method: charsPerPage > 0 ? 'NativeText' : 'Hybrid',
      extractedCharacters: charCount,
      charactersPerPage: charsPerPage,
      emptyPages: undefined, // Desconocido por ahora
      warnings,
      requiresHumanReview: warnings.length > 0
    };
    assets.push(qualityAsset);

    return assets;
  }
}

/**
 * Generador inyector para la Capability
 */
export const buildPdfExtractDescriptor = (extractor: PdfExtractor): CapabilityDescriptor<DocumentStream, PdfExtractOutput> => ({
  id: CapabilityId.of('reader.pdf.extract.v1'),
  version: '1.0.0',
  requirements: [],
  profile: {
    estimatedMemoryMB: 200,
    estimatedLatencyMs: 1500,
    estimatedCpuUsage: 'High',
    parallelizable: true,
    suggestedPriority: 'Normal'
  },
  preconditions: (input) => {
    return { valid: !!input };
  },
  postconditions: (output) => {
    // Al menos debe venir Metadata y Quality
    return { valid: output && output.some(a => a.assetType === 'Metadata') && output.some(a => a.assetType === 'ExtractionQuality') };
  },
  createInstance: async () => new PdfExtractCapability(extractor)
});
