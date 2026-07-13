import { CapabilityId } from '../types/index.js';

export interface RouteCondition {
  /**
   * Nombre del AssetType requerido
   */
  readonly assetType: string;
  /**
   * Condición sobre alguna propiedad del Asset. 
   * Ej: { property: 'mimeType', value: 'application/pdf' }
   */
  readonly property?: string;
  readonly value?: any;
}

export interface RouteDefinition {
  readonly conditions: RouteCondition[];
  readonly targetCapabilities: CapabilityId[];
}

export class CapabilityRoutingTable {
  private routes: RouteDefinition[] = [];

  addRoute(route: RouteDefinition): void {
    this.routes.push(route);
  }

  getRoutes(): ReadonlyArray<RouteDefinition> {
    return this.routes;
  }
}
