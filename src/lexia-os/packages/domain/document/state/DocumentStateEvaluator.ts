import { Document, DocumentState, DocumentCapabilityNeed, ExtractionQualityAsset } from '../contracts.js';

export class DocumentStateEvaluator {
  evaluate(document: Document): DocumentState {
    const missingCapabilities: DocumentCapabilityNeed[] = [];
    const warnings: string[] = [];

    // 1. Necesidad de Texto
    const hasText = document.assets.has('PlainText');
    if (!hasText) {
      missingCapabilities.push('NEEDS_TEXT');
    }

    // 2. Necesidad de OCR (Si la calidad de extracción indica que solo hay imágenes)
    const quality = document.assets.latest<ExtractionQualityAsset>('ExtractionQuality');
    if (quality && quality.warnings.includes('IMAGE_ONLY')) {
      missingCapabilities.push('NEEDS_OCR');
    }

    // 3. Necesidad de Índice
    const hasIndex = document.assets.has('DocumentIndex');
    if (hasText && !hasIndex) {
      missingCapabilities.push('NEEDS_INDEX');
    }

    // Determinar si está listo para siguientes fases
    const readyForClassification = hasText && hasIndex;
    const readyForDrafting = readyForClassification; // Simplificación inicial

    return {
      missingCapabilities,
      readyForClassification,
      readyForDrafting,
      warnings: quality ? [...quality.warnings] : []
    };
  }
}
