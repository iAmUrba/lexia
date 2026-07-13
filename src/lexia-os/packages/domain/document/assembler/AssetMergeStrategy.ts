import { DocumentAsset } from '../contracts.js';

export interface AssetMergeStrategy {
  /**
   * El tipo de Asset que esta estrategia sabe manejar
   */
  readonly assetType: string;

  /**
   * Decide qué hacer cuando se propone un nuevo Asset para un documento
   * @param existingAssets Los assets actuales de este tipo en el documento
   * @param newAsset El nuevo asset propuesto en el snapshot
   * @returns El arreglo final de assets de este tipo (ej. versión 2 y ocultando versión 1)
   */
  merge(existingAssets: DocumentAsset[], newAsset: DocumentAsset): DocumentAsset[];
}

export class DefaultVersioningStrategy implements AssetMergeStrategy {
  constructor(public readonly assetType: string) {}

  merge(existingAssets: DocumentAsset[], newAsset: DocumentAsset): DocumentAsset[] {
    // La estrategia por defecto asume que si hay versiones anteriores,
    // se mantienen en el arreglo, pero la de mayor versión es la "activa".
    // Esto previene que se sobrescriban los assets y permite auditoría y rollback.
    const highestVersion = existingAssets.reduce((max, a) => Math.max(max, a.version), 0);
    
    // Forzamos el versionado
    const versionedAsset = {
      ...newAsset,
      version: highestVersion + 1
    };
    
    return [...existingAssets, versionedAsset];
  }
}
