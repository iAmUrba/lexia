import { ExecutionPlan } from './ExecutionPlanBuilder.js';
import { ExecutionTimeline, TransactionState, TransactionManager } from './TransactionManager.js';
import { PreflightReport } from './PreflightValidator.js';

export class ExecutionReport {
    constructor(
        public readonly executionId: string,
        public readonly planId: string,
        public readonly traceId: string,
        public readonly finalState: TransactionState,
        public readonly success: boolean,
        public readonly timeline: ExecutionTimeline,
        public readonly finalizedAt: string
    ) {
        Object.freeze(this);
    }
}

export class AuditFinalizer {
    public finalize(executionId: string, plan: ExecutionPlan, timeline: ExecutionTimeline): ExecutionReport {
        const events = timeline.getEvents();
        let lastState = TransactionState.PENDING;
        
        // Find the last actual TransactionState (ignoring PRECHECK_OK etc if possible, though they aren't in TransactionState enum)
        for (let i = events.length - 1; i >= 0; i--) {
            const s = events[i].state as any;
            if (Object.values(TransactionState).includes(s)) {
                lastState = s;
                break;
            }
        }
        
        const success = lastState === TransactionState.COMMITTED;
        
        return new ExecutionReport(
            executionId,
            plan.planId,
            plan.traceId,
            lastState,
            success,
            timeline,
            new Date().toISOString()
        );
    }
}

export class RecoveryManager {
    constructor(
        private transactionManager: TransactionManager,
        private auditFinalizer: AuditFinalizer
    ) {}

    public async resume(
        executionId: string, 
        plan: ExecutionPlan, 
        preflight: PreflightReport, 
        indexPath: string
    ): Promise<ExecutionReport> {
        // La orquestación y el manejo de estados persistidos ya lo realiza el TransactionManager
        // internamente en su método execute() al leer el ITransactionStateStore
        const timeline = await this.transactionManager.execute(executionId, plan, preflight, indexPath);
        return this.auditFinalizer.finalize(executionId, plan, timeline);
    }
}
