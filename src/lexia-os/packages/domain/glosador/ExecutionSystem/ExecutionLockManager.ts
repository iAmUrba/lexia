import { ExecutionLock } from './Contracts/ExecutionContracts.js';
import { LockError } from './Contracts/ExecutionErrors.js';

export class ExecutionLockManager {
    private locks: Map<string, ExecutionLock> = new Map();

    public async acquire(decisionEventId: string, owner: string): Promise<void> {
        const existingLock = this.locks.get(decisionEventId);
        const now = new Date().getTime();

        if (existingLock) {
            const expiresAt = new Date(existingLock.expiresAt).getTime();
            if (now < expiresAt) {
                throw new LockError('Ya existe una ejecución en curso para este documento');
            }
            // If expired, we can steal the lock (Recovery)
        }

        const lock: ExecutionLock = {
            owner,
            startedAt: new Date(now).toISOString(),
            expiresAt: new Date(now + 30000).toISOString(), // 30s timeout
            heartbeat: new Date(now).toISOString()
        };

        this.locks.set(decisionEventId, lock);
    }

    public async heartbeat(decisionEventId: string, owner: string): Promise<void> {
        const lock = this.locks.get(decisionEventId);
        if (!lock || lock.owner !== owner) {
            throw new LockError('No tienes el lock activo');
        }

        const now = new Date().getTime();
        lock.heartbeat = new Date(now).toISOString();
        lock.expiresAt = new Date(now + 30000).toISOString();
    }

    public async release(decisionEventId: string, owner: string): Promise<void> {
        const lock = this.locks.get(decisionEventId);
        if (lock && lock.owner === owner) {
            this.locks.delete(decisionEventId);
        }
    }
}
