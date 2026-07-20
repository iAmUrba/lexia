import { ExecutionPlan, PlanOperation } from './ExecutionPlanBuilder.js';
import { PreflightReport } from './PreflightValidator.js';
import * as crypto from 'crypto';

export interface DryRunOperationResult {
    operation: PlanOperation;
    status: 'READY' | 'SKIPPED' | 'BLOCKED';
    reason?: string;
}

export class DryRunReport {
    constructor(
        public readonly executionId: string,
        public readonly traceId: string,
        public readonly ready: boolean,
        public readonly operations: ReadonlyArray<DryRunOperationResult>,
        public readonly estimatedDurationMs: number,
        public readonly warnings: ReadonlyArray<string>
    ) {
        Object.freeze(this.operations);
        Object.freeze(this.warnings);
        Object.freeze(this);
    }
}

export class DryRunExecutor {
    public execute(plan: ExecutionPlan, preflight: PreflightReport): DryRunReport {
        const executionId = crypto.randomUUID();
        const warnings: string[] = [];
        const opResults: DryRunOperationResult[] = [];
        
        let globalReady = true;

        if (!preflight.success) {
            globalReady = false;
            warnings.push('Preflight fallido: no se pueden procesar las operaciones');
        }

        if (plan.operations.length === 0) {
            warnings.push('Plan vacío: sin operaciones para ejecutar');
        }

        for (const op of plan.operations) {
            let status: 'READY' | 'SKIPPED' | 'BLOCKED' = 'READY';
            let reason: string | undefined = undefined;

            if (!preflight.success) {
                status = 'BLOCKED';
                reason = 'Preflight report status is FAIL';
            }

            opResults.push({
                operation: op,
                status,
                reason
            });
        }

        return new DryRunReport(
            executionId,
            plan.traceId,
            globalReady,
            opResults,
            opResults.length * 50, // mock estimation
            warnings
        );
    }
}
