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
        const buffer = await this.read(path, options);
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    async read(path: string, options?: { traceId?: string }): Promise<Buffer> {
        try {
            const url = `/drives/${this.driveId}/root${this.getPathSegment(path)}content`;
            const response = await this.graphClient.get<any>(url, options);
            if (Buffer.isBuffer(response)) return response;
            if (typeof response === 'string') return Buffer.from(response);
            return Buffer.from(JSON.stringify(response));
        } catch (e) {
            this.mapError(e);
        }
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
            
            await this.graphClient.post(cleanUrl, {
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
            await this.graphClient.post(`${cleanUrl}/delete`, {}, options);
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
}
