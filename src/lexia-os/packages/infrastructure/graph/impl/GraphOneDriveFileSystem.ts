import { IFileSystem } from '../../../domain/glosador/ExecutionSystem/Contracts/IFileSystem.js';
import { InfrastructureError, InfrastructureErrorType } from '../../../domain/glosador/ExecutionSystem/Contracts/InfrastructureError.js';
import { GraphClient } from './GraphClient.js';
import * as crypto from 'crypto';

export class GraphOneDriveFileSystem implements IFileSystem {
    private readonly driveId: string;

    constructor(
        private graphClient: GraphClient,
        driveId: string
    ) {
        this.driveId = driveId;
    }

    private getPathSegment(path: string): string {
        // Strip leading slash if any
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return cleanPath ? `:/${cleanPath}:/` : '';
    }

    private mapError(error: any): never {
        if (error.name === 'AbortError') {
            throw new InfrastructureError(InfrastructureErrorType.CANCELLATION, 'Operation aborted', error);
        }
        if (error.name === 'GraphApiError') {
            switch (error.status) {
                case 401:
                case 403:
                    throw new InfrastructureError(InfrastructureErrorType.AUTHENTICATION, error.message, error);
                case 404:
                    throw new InfrastructureError(InfrastructureErrorType.NOT_FOUND, error.message, error);
                case 429:
                    throw new InfrastructureError(InfrastructureErrorType.RATE_LIMIT, error.message, error);
                case 503:
                case 504:
                    throw new InfrastructureError(InfrastructureErrorType.NETWORK, 'Service unavailable', error);
                default:
                    throw new InfrastructureError(InfrastructureErrorType.UNKNOWN, error.message, error);
            }
        }
        if (error.message === 'Failed to fetch' || error.code === 'ECONNRESET') {
             throw new InfrastructureError(InfrastructureErrorType.NETWORK, 'Network error', error);
        }
        throw new InfrastructureError(InfrastructureErrorType.UNKNOWN, error.message || 'Unknown error', error);
    }

    async exists(path: string, options?: { traceId?: string }): Promise<boolean> {
        try {
            await this.stat(path, options);
            return true;
        } catch (e: any) {
            if (e instanceof InfrastructureError && e.type === InfrastructureErrorType.NOT_FOUND) return false;
            throw e;
        }
    }

    async stat(path: string, options?: { traceId?: string }): Promise<{ size: number; lastModified: string; }> {
        try {
            const url = `/drives/${this.driveId}/root${this.getPathSegment(path)}`;
            const cleanUrl = url.endsWith(':/') ? url.substring(0, url.length - 2) : url;
            const response = await this.graphClient.get<any>(cleanUrl, options);
            return {
                size: response.size,
                lastModified: response.lastModifiedDateTime
            };
        } catch (e) {
            this.mapError(e);
        }
    }

    async calculateHash(path: string, options?: { traceId?: string }): Promise<string> {
        try {
            const url = `/drives/${this.driveId}/root${this.getPathSegment(path)}`;
            const cleanUrl = url.endsWith(':/') ? url.substring(0, url.length - 2) : url;
            const metadata = await this.graphClient.get<any>(cleanUrl, options);
            if (metadata.file?.hashes?.sha256Hash) {
                return metadata.file.hashes.sha256Hash.toLowerCase();
            }
            const buffer = await this.read(path, options);
            return crypto.createHash('sha256').update(buffer).digest('hex');
        } catch (e) {
            this.mapError(e);
        }
    }

    async read(path: string, options?: { traceId?: string }): Promise<Buffer> {
        try {
            const url = `/drives/${this.driveId}/root${this.getPathSegment(path)}`;
            const cleanUrl = url.endsWith(':/') ? url.substring(0, url.length - 2) : url;
            
            const startMeta = performance.now();
            const metadata = await this.graphClient.get<any>(cleanUrl, options);
            
            const downloadUrl = metadata['@microsoft.graph.downloadUrl'];
            if (!downloadUrl) {
                throw new Error('Download URL not found in metadata');
            }

            // NOTA DE AUDITORÍA: OneDrive for Business / SharePoint usa quickXorHash.
            // OneDrive Personal usa sha256Hash y crc32Hash.
            // LexIA requiere SHA-256 para cadena de custodia. Si Graph no lo provee,
            // lo calculamos localmente sobre el buffer descargado.
            const graphSha256 = metadata.file?.hashes?.sha256Hash;
            const graphQuickXor = metadata.file?.hashes?.quickXorHash;
            
            const response = await fetch(downloadUrl);
            if (!response.ok) {
                throw new Error(`Failed to download binary: ${response.statusText}`);
            }
            
            // LIMITACIÓN CONOCIDA (Auditoría): arrayBuffer() carga todo el archivo en memoria.
            // Para archivos de 100-300MB esto es subóptimo.
            // TODO (Evolución): Refactorizar a Node.js Readable Streams (response.body)
            // cuando se implemente el procesamiento por chunks.
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const localSha256 = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();

            // Telemetría Estricta (Auditoría Custodia)
            const providerHashType = graphSha256 ? 'sha256Hash' : (graphQuickXor ? 'quickXorHash' : 'none');
            const providerHash = graphSha256 || graphQuickXor || 'N/A';
            console.log(`\n[Graph File Telemetry - ${path}]`);
            console.log(`providerHashType: ${providerHashType}`);
            console.log(`providerHash: ${providerHash}`);
            console.log(`localSha256: ${localSha256}`);
            console.log(`downloadBytes: ${buffer.length}`);
            console.log(`downloadMethod: @microsoft.graph.downloadUrl\n`);

            // Si Graph nos dio un SHA-256 (ej. cuenta personal), lo verificamos estrictamente.
            if (graphSha256) {
                if (localSha256 !== graphSha256.toUpperCase()) {
                    throw new Error(`Hash mismatch for ${path}. Expected ${graphSha256}, got ${localSha256}`);
                }
            } else if (graphQuickXor) {
                // TODO: Implementar validación local de QuickXorHash si es estrictamente necesario.
                // Por ahora, documentamos el quickXorHash y confiamos en el SHA-256 local.
            }

            return buffer;
        } catch (e) {
            this.mapError(e);
        }
    }

    async readStream(path: string, options?: { traceId?: string }): Promise<any> {
        throw new Error('NotImplemented: Streaming read is reserved for future chunked processing evolution');
    }

    async write(path: string, data: Buffer, options?: { traceId?: string }): Promise<void> {
        try {
            const url = `/drives/${this.driveId}/root${this.getPathSegment(path)}content`;
            await this.graphClient.post(url, data, options);
        } catch (e) {
            this.mapError(e);
        }
    }

    async copyFile(source: string, destination: string, options?: { traceId?: string }): Promise<void> {
        try {
            const destParts = destination.split('/');
            const destName = destParts.pop();
            const destParent = destParts.join('/') || '/';
            const parentRef = {
                driveId: this.driveId,
                path: `/drive/root${this.getPathSegment(destParent)}`
            };
            const url = `/drives/${this.driveId}/root${this.getPathSegment(source)}copy`;
            const cleanUrl = url.replace(':/copy', ':/copy').replace('rootcopy', 'root/copy');
            
            await this.graphClient.post(cleanUrl, {
                parentReference: parentRef,
                name: destName
            }, options);
        } catch (e) {
            this.mapError(e);
        }
    }

    async move(source: string, destination: string, options?: { traceId?: string }): Promise<void> {
        try {
            const destParts = destination.split('/');
            const destName = destParts.pop();
            const destParent = destParts.join('/') || '/';
            const parentRef = {
                driveId: this.driveId,
                path: `/drive/root${this.getPathSegment(destParent)}`
            };
            const url = `/drives/${this.driveId}/root${this.getPathSegment(source)}`;
            const cleanUrl = url.endsWith(':/') ? url.substring(0, url.length - 2) : url;
            
            await this.graphClient.patch(cleanUrl, {
                parentReference: parentRef,
                name: destName
            }, options);
        } catch (e) {
            this.mapError(e);
        }
    }

    async deleteFile(path: string, options?: { traceId?: string }): Promise<void> {
        try {
            const url = `/drives/${this.driveId}/root${this.getPathSegment(path)}`;
            const cleanUrl = url.endsWith(':/') ? url.substring(0, url.length - 2) : url;
            await this.graphClient.delete(cleanUrl, options);
        } catch (e) {
            this.mapError(e);
        }
    }

    async list(path: string, options?: { traceId?: string }): Promise<string[]> {
        try {
            const url = `/drives/${this.driveId}/root${this.getPathSegment(path)}children`;
            const response = await this.graphClient.get<any>(url, options);
            if (!response || !response.value) return [];
            return response.value.map((item: any) => item.name);
        } catch (e) {
            this.mapError(e);
        }
    }

    /**
     * Búsqueda en todo el Drive por nombre de archivo o carpeta
     */
    async search(query: string, options?: { traceId?: string }): Promise<any[]> {
        try {
            // Documentación Graph API: GET /drives/{drive-id}/root/search(q='{query}')
            const url = `/drives/${this.driveId}/root/search(q='${encodeURIComponent(query)}')`;
            const response = await this.graphClient.get<any>(url, options);
            if (!response || !response.value) return [];
            return response.value;
        } catch (e) {
            this.mapError(e);
        }
    }
}
