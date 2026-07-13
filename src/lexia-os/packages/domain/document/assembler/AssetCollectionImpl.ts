import { DocumentAssetCollection, DocumentAsset, AssetType } from '../contracts.js';

export class AssetCollectionImpl implements DocumentAssetCollection {
  constructor(public readonly items: ReadonlyArray<DocumentAsset>) {}

  latest<T extends DocumentAsset>(type: AssetType): T | undefined {
    // Asumimos que los assets más nuevos están al final o iteramos de atrás hacia adelante
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i].assetType === type) {
        return this.items[i] as T;
      }
    }
    return undefined;
  }

  all<T extends DocumentAsset>(type: AssetType): T[] {
    return this.items.filter(a => a.assetType === type) as T[];
  }

  has(type: AssetType): boolean {
    return this.items.some(a => a.assetType === type);
  }

  find<T extends DocumentAsset>(predicate: (asset: DocumentAsset) => boolean): T | undefined {
    return this.items.find(predicate) as T | undefined;
  }
}
