import {
    GraphConfiguration,
    IGraphTransport,
    IGraphAuthProvider,
    GraphApiError,
    GraphTelemetry
} from '../contracts/GraphContracts.js';
import * as crypto from 'crypto';
import {
    GraphConfigurationError,
    GraphAuthenticationError,
    GraphPermissionError,
    GraphNotFoundError,
    GraphRateLimitError,
    GraphNetworkError
} from '../errors.js';

export class GraphClient {
    private readonly MAX_RETRIES = 3;
    private readonly BASE_DELAY_MS = 500;

    constructor(
        private config: GraphConfiguration,
        private authProvider: IGraphAuthProvider,
        private transport: IGraphTransport,
        private onTelemetry: (telemetry: GraphTelemetry) => void = () => {}
    ) {}

    public async get<T>(path: string, options?: { signal?: AbortSignal, traceId?: string }): Promise<T> {
        return this.executeWithRetry<T>('GET', path, options || {});
    }

    public async post<T>(path: string, body: any, options?: { signal?: AbortSignal, traceId?: string }): Promise<T> {
        return this.executeWithRetry<T>('POST', path, { ...options, body });
    }

    public async patch<T>(path: string, body: any, options?: { signal?: AbortSignal, traceId?: string }): Promise<T> {
        return this.executeWithRetry<T>('PATCH', path, { ...options, body });
    }

    public async delete<T>(path: string, options?: { signal?: AbortSignal, traceId?: string }): Promise<T> {
        return this.executeWithRetry<T>('DELETE', path, options || {});
    }

    private async executeWithRetry<T>(
        method: string,
        path: string,
        options: { body?: any; signal?: AbortSignal; traceId?: string }
    ): Promise<T> {
        if (this.config.environment !== 'SANDBOX' && this.config.environment !== 'PRODUCTION') {
            throw new GraphConfigurationError('Entorno no configurado explícitamente');
        }
        
        if (!this.config.tenantId || !this.config.clientId || !this.config.baseUrl || !this.config.apiVersion) {
            throw new GraphConfigurationError('Faltan variables requeridas de configuración (tenantId, clientId, baseUrl o apiVersion)');
        }

        const correlationId = crypto.randomUUID();
        const traceId = options.traceId || crypto.randomUUID();
        let attempt = 0;
        
        while (attempt <= this.MAX_RETRIES) {
            const requestId = crypto.randomUUID();
            const start = performance.now();
            
            try {
                const token = await this.authProvider.getAccessToken();
                const fullUrl = `${this.config.baseUrl}/${this.config.apiVersion}${path}`;
                const headers: Record<string, string> = {
                    'Authorization': `Bearer ${token}`,
                    'client-request-id': requestId,
                    'Content-Type': 'application/json'
                };

                const response = await this.transport.request<T>(method, fullUrl, {
                    body: options.body,
                    headers,
                    signal: options.signal
                });

                const elapsedMs = performance.now() - start;

                this.onTelemetry({
                    traceId,
                    requestId,
                    correlationId,
                    operationName: `${method} ${path}`,
                    retryCount: attempt,
                    responseCode: response.status,
                    payloadSize: response.data ? JSON.stringify(response.data).length : 0,
                    elapsedMs
                });

                if (response.status >= 200 && response.status < 300) {
                    return response.data as T;
                }

                if (response.status === 401) {
                    this.authProvider.invalidateToken();
                    const err = new GraphAuthenticationError('Token inválido o expirado');
                    (err as any).telemetrySent = true;
                    throw err;
                }
                
                if (response.status === 403) {
                    const err = new GraphPermissionError('Permisos insuficientes en Microsoft Graph');
                    (err as any).telemetrySent = true;
                    throw err;
                }

                if (response.status === 404) {
                    const err = new GraphNotFoundError(`Recurso no encontrado: ${path}`);
                    (err as any).telemetrySent = true;
                    throw err;
                }

                if (response.status === 409) {
                    const err = new GraphNetworkError(`Conflicto de estado en Graph (409): ${path}`);
                    (err as any).telemetrySent = true;
                    throw err;
                }

                if (response.status === 412) {
                    const err = new GraphNetworkError(`Precondición fallida en Graph (412): ${path}`);
                    (err as any).telemetrySent = true;
                    throw err;
                }

                if (response.status === 429 || response.status >= 500) {
                    const err = new GraphRateLimitError(`Rate limit o error de servidor (${response.status}) en Microsoft Graph`);
                    (err as any).telemetrySent = true;
                    (err as any).retryable = true;
                    throw err;
                }

                const err = new GraphNetworkError(`Graph API Error: ${response.status}`);
                (err as any).telemetrySent = true;
                throw err;

            } catch (error: any) {
                const elapsedMs = performance.now() - start;
                
                if (error.name === 'AbortError') {
                     this.onTelemetry({
                        traceId,
                        requestId,
                        correlationId,
                        operationName: `${method} ${path}`,
                        retryCount: attempt,
                        responseCode: 0,
                        payloadSize: 0,
                        elapsedMs
                    });
                    throw error;
                }

                if (!error.telemetrySent) {
                    const status = (error as any).status || 0;
                    this.onTelemetry({
                        traceId,
                        requestId,
                        correlationId,
                        operationName: `${method} ${path}`,
                        retryCount: attempt,
                        responseCode: status,
                        payloadSize: 0,
                        elapsedMs
                    });
                }

                const isRetryable = error.retryable === true;
                
                if (!isRetryable || attempt === this.MAX_RETRIES) {
                    throw error;
                }

                attempt++;
                await this.delay(attempt);
            }
        }
        
        throw new Error('Unreachable code');
    }

    private async delay(attempt: number): Promise<void> {
        // Exponential backoff with jitter
        const backoff = this.BASE_DELAY_MS * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 200; // up to 200ms jitter
        const waitTime = backoff + jitter;
        
        return new Promise(resolve => setTimeout(resolve, waitTime));
    }
}
