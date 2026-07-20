import { ExecutionPlan, ExecutionState } from './Contracts/ExecutionContracts.js';
import { PreflightValidator } from './PreflightValidator.js';
import { TransactionManager, IStateStore } from './TransactionManager.js';
import { ExecutionLockManager } from './ExecutionLockManager.js';
import { PreflightError } from './Contracts/ExecutionErrors.js';
import * as crypto from 'crypto';

export class ExecutionOrchestrator {
    constructor(
        private preflight: PreflightValidator,
        private lockManager: ExecutionLockManager,
        private transactionManager: TransactionManager,
        private stateStore: IStateStore
    ) {}

    public async startExecution(plan: ExecutionPlan, executorId: string): Promise<void> {
        const executionId = crypto.randomUUID();

        // 1. Acquire Lock
        await this.lockManager.acquire(plan.decisionEventId, executionId);

        try {
            await this.stateStore.saveState(executionId, ExecutionState.PENDING);

            // 2. Preflight Validation
            try {
                await this.preflight.validate(plan);
                await this.stateStore.saveState(executionId, ExecutionState.PREFLIGHT_OK);
            } catch (preflightError) {
                // Abort before any transaction
                throw preflightError;
            }

            // 3. Heartbeat
            await this.lockManager.heartbeat(plan.decisionEventId, executionId);

            // 4. Execute Transaction
            await this.transactionManager.execute(executionId, plan, executorId);

        } finally {
            // 5. Release Lock
            await this.lockManager.release(plan.decisionEventId, executionId);
        }
    }
}
