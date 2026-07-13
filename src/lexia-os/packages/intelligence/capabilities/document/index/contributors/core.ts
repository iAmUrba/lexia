import { Document, DocumentIndexAsset } from '../../../../../../domain/document/index.js';

export interface IndexContributor {
  contribute(document: Document, index: Partial<Omit<DocumentIndexAsset, 'assetId' | 'assetType' | 'version' | 'producer' | 'producedAt' | 'confidence'>>): void;
}
