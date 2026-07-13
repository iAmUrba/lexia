import { Document, DocumentSnapshot, DocumentAsset, TimelineOperation } from '../contracts.js';
import { AssetMergeStrategy, DefaultVersioningStrategy } from './AssetMergeStrategy.js';
import { AssetCollectionImpl } from './AssetCollectionImpl.js';
import { Clock } from '../../../../packages/foundation/clock/index.js';

export class DocumentAssembler {
  private strategies: Map<string, AssetMergeStrategy> = new Map();

  constructor() {
    // Registrar estrategias base. 
    // En el futuro, PlainTextMergeStrategy, MetadataMergeStrategy, etc. pueden inyectarse aquí.
  }

  registerStrategy(strategy: AssetMergeStrategy): void {
    this.strategies.set(strategy.assetType, strategy);
  }

  private getStrategy(assetType: string): AssetMergeStrategy {
    const strategy = this.strategies.get(assetType);
    if (strategy) return strategy;
    // Si no hay estrategia especializada, usamos el versionado estricto por defecto
    return new DefaultVersioningStrategy(assetType);
  }

  /**
   * Genera un nuevo Document inmutable aplicando el Snapshot
   */
  applySnapshot(document: Document, snapshot: DocumentSnapshot): Document {
    const existingAssetsByType = new Map<string, DocumentAsset[]>();
    const newAssetsArray: DocumentAsset[] = [];
    
    // Agrupar los assets existentes
    for (const asset of document.assets.items) {
      const typeList = existingAssetsByType.get(asset.assetType) || [];
      typeList.push(asset);
      existingAssetsByType.set(asset.assetType, typeList);
    }

    // Procesar los assets del Snapshot agrupados por tipo para hacer merge
    const snapshotAssetsByType = new Map<string, DocumentAsset[]>();
    for (const asset of snapshot.assets) {
      const typeList = snapshotAssetsByType.get(asset.assetType) || [];
      typeList.push(asset);
      snapshotAssetsByType.set(asset.assetType, typeList);
    }

    for (const [type, incomingAssets] of snapshotAssetsByType.entries()) {
      const strategy = this.getStrategy(type);
      let currentAssetsForType = existingAssetsByType.get(type) || [];
      
      for (const newAsset of incomingAssets) {
        currentAssetsForType = strategy.merge(currentAssetsForType, newAsset);
      }
      
      // Reemplazar la lista agrupada con el resultado del merge
      existingAssetsByType.set(type, currentAssetsForType);
    }

    // Aplanar los assets finales
    for (const typeList of existingAssetsByType.values()) {
      newAssetsArray.push(...typeList);
    }

    // Generar la operación de timeline
    const operation: TimelineOperation = {
      operation: `Snapshot Applied`,
      actor: snapshot.producer.toString(),
      timestamp: Clock.timestamp()
    };

    const newTimeline = {
      operations: [...document.timeline.operations, operation]
    };
    
    // Crear la CapabilityExecution
    const execution: any = {
      id: snapshot.operationId?.value || snapshot.correlationId?.value || Date.now().toString(),
      capability: snapshot.producer.toString(),
      startedAt: snapshot.startedAt || Clock.timestamp() - snapshot.durationMs,
      finishedAt: snapshot.finishedAt || Clock.timestamp(),
      inputs: [], // Omitido temporalmente hasta que el snapshot especifique qué consumió
      outputs: snapshot.assets.map(a => a.assetId),
      warnings: snapshot.warnings || [],
      executionTimeMs: snapshot.durationMs,
      version: snapshot.producer.toString() // Podría extraerse la versión real si CapabilityId la expusiera separada
    };

    const newExecutions = [...(document.executions || []), execution];

    // Construir el documento nuevo e inmutable
    return Object.freeze({
      identity: { ...document.identity },
      provenance: { ...document.provenance },
      assets: new AssetCollectionImpl(Object.freeze(newAssetsArray)),
      timeline: Object.freeze(newTimeline),
      executions: Object.freeze(newExecutions)
    });
  }
}
