import { CapabilityDescriptor, CapabilityContext, CapabilityInstance, CapabilityId } from '../../../../engine/index.js';
import { Document, DocumentIndexAsset } from '../../../../domain/document/index.js';
import { Id } from '../../../../foundation/id/index.js';
import { IndexContributor } from './contributors/core.js';

export class DocumentIndexCapability implements CapabilityInstance<Document, DocumentIndexAsset[]> {
  constructor(private readonly contributors: IndexContributor[]) {}

  async execute(input: Document, context: CapabilityContext): Promise<DocumentIndexAsset[]> {
    const timestamp = context.clock.timestamp();
    
    // Si ya existe un IndexAsset, podríamos clonarlo como base.
    // Por simplicidad en V1, creamos uno nuevo vacío.
    const partialIndex: Partial<Omit<DocumentIndexAsset, 'assetId' | 'assetType' | 'version' | 'producer' | 'producedAt' | 'confidence'>> = {
      identifiers: [],
      people: [],
      dates: [],
      locations: [],
      citations: []
    };

    // Ejecutamos todos los plugins/contribuidores de extracción
    for (const contributor of this.contributors) {
      contributor.contribute(input, partialIndex);
    }

    // Opcionalmente podemos inferir el primaryIdentifier si hay radicados
    let primaryIdentifier = undefined;
    if (partialIndex.identifiers && partialIndex.identifiers.length > 0) {
      primaryIdentifier = partialIndex.identifiers[0];
    }

    const finalAsset: DocumentIndexAsset = {
      assetId: { value: Id.generate().value },
      assetType: 'DocumentIndex',
      version: 1,
      producer: CapabilityId.of('document.index.v1'),
      producedAt: timestamp,
      confidence: { score: 100, origin: 'Deterministic' },
      primaryIdentifier,
      identifiers: partialIndex.identifiers || [],
      people: partialIndex.people || [],
      dates: partialIndex.dates || [],
      locations: partialIndex.locations || [],
      citations: partialIndex.citations || []
    };

    return [finalAsset];
  }
}

/**
 * Generador inyector para la Capability
 */
export const buildDocumentIndexDescriptor = (contributors: IndexContributor[]): CapabilityDescriptor<Document, DocumentIndexAsset[]> => ({
  id: CapabilityId.of('document.index.v1'),
  version: '1.0.0',
  requirements: [],
  profile: {
    estimatedMemoryMB: 100,
    estimatedLatencyMs: 150,
    estimatedCpuUsage: 'Medium',
    parallelizable: true,
    suggestedPriority: 'Normal'
  },
  preconditions: (input) => {
    // Al menos debe tener un PlainTextAsset para poder indexar
    return { valid: input && input.assets.has('PlainText') };
  },
  postconditions: (output) => {
    return { valid: output && output.some(a => a.assetType === 'DocumentIndex') };
  },
  createInstance: async () => new DocumentIndexCapability(contributors)
});
