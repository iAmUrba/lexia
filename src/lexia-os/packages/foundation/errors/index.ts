export class LexiaError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends LexiaError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class InfrastructureError extends LexiaError {
  constructor(message: string, details?: any) {
    super(message, 'INFRASTRUCTURE_ERROR', details);
  }
}

export class ConfigurationError extends LexiaError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
  }
}
