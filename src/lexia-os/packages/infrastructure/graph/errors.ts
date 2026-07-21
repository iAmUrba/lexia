export class GraphError extends Error {
    constructor(message: string, public readonly originalError?: any) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class GraphConfigurationError extends GraphError {}
export class GraphAuthenticationError extends GraphError {}
export class GraphPermissionError extends GraphError {}
export class GraphNotFoundError extends GraphError {}
export class GraphRateLimitError extends GraphError {}
export class GraphHashMismatchError extends GraphError {}
export class GraphNetworkError extends GraphError {}
