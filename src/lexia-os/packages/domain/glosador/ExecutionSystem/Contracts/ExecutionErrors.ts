export class PreflightError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PreflightError';
    }
}

export class LockError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LockError';
    }
}

export class HashMismatchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'HashMismatchError';
    }
}

export class RollbackError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RollbackError';
    }
}

export class PostCommitVerificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PostCommitVerificationError';
    }
}

export class InvalidStateTransitionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidStateTransitionError';
    }
}
