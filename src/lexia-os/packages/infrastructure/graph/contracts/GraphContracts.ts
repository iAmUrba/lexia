export enum LexIAEnvironment {
    SANDBOX = 'SANDBOX',
    PRODUCTION = 'PRODUCTION'
}

export interface GraphConfiguration {
    apiVersion: string;
    baseUrl: string;
    tenantId: string;
    clientId: string;
    scopes: string[];
    authority: string;
    environment: LexIAEnvironment;
}

export interface GraphTelemetry {
    traceId: string;
    requestId: string;
    correlationId: string;
    operationName: string;
    retryCount: number;
    responseCode: number;
    payloadSize: number;
    elapsedMs: number;
}

export interface IGraphAuthProvider {
    getAccessToken(): Promise<string>;
    invalidateToken(): void;
}

export interface IGraphTransport {
    request<T>(
        method: string,
        path: string,
        options?: {
            body?: any;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }
    ): Promise<{
        status: number;
        data: T | null;
        headers: Record<string, string>;
    }>;
}

export class GraphApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public retryable: boolean
    ) {
        super(message);
        this.name = 'GraphApiError';
    }
}
