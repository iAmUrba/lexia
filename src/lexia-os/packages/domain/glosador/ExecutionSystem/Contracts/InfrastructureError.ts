export enum InfrastructureErrorType {
    AUTHENTICATION = 'AUTHENTICATION',
    RATE_LIMIT = 'RATE_LIMIT',
    TIMEOUT = 'TIMEOUT',
    NETWORK = 'NETWORK',
    INTEGRITY = 'INTEGRITY',
    CANCELLATION = 'CANCELLATION',
    NOT_FOUND = 'NOT_FOUND',
    UNKNOWN = 'UNKNOWN'
}

export class InfrastructureError extends Error {
    constructor(
        public readonly type: InfrastructureErrorType,
        message: string,
        public readonly originalError?: any
    ) {
        super(`[${type}] ${message}`);
        this.name = 'InfrastructureError';
    }
}
