import { ExecutionPlan } from './ExecutionPlanBuilder.js';
import { IFileSystem } from './Contracts/IFileSystem.js';

export interface ValidationResult {
    rule: string;
    status: 'PASS' | 'FAIL';
    details?: string;
}

export class PreflightReport {
    constructor(
        public readonly success: boolean,
        public readonly executedAt: string,
        public readonly executionPlanHash: string,
        public readonly validations: ReadonlyArray<ValidationResult>,
        public readonly telemetry: {
            durationMs: number;
        }
    ) {
        Object.freeze(this.validations);
        Object.freeze(this.telemetry);
        Object.freeze(this);
    }
}

// Temporary Lock Interface for Phase 2 preflight
export interface IExecutionLockManager {
    isLocked(expedienteId: string): Promise<boolean>;
}

export class PreflightValidator {
    constructor(
        private fs: IFileSystem,
        private lockManager: IExecutionLockManager
    ) {}

    public async validate(
        plan: ExecutionPlan,
        expedienteId: string,
        indicePath: string,
        expectedIndiceHash: string
    ): Promise<PreflightReport> {
        const start = performance.now();
        const validations: ValidationResult[] = [];
        let success = true;

        const addRule = (rule: string, passed: boolean, details?: string) => {
            validations.push({ rule, status: passed ? 'PASS' : 'FAIL', details });
            if (!passed) success = false;
        };

        // 1. Plan Integrity
        const payload = JSON.stringify({
            planId: plan.planId,
            traceId: plan.traceId,
            decisionEventId: plan.decisionEventId,
            expectedPdfHash: plan.expectedPdfHash,
            engineVersion: plan.engineVersion,
            operations: plan.operations
        });
        const crypto = await import('crypto');
        const actualPlanHash = crypto.createHash('sha256').update(payload).digest('hex');
        addRule('Plan Integrity', plan.planHash === actualPlanHash, 'Hash del ExecutionPlan alterado');

        // 2. Lock check
        try {
            const locked = await this.lockManager.isLocked(expedienteId);
            addRule('Execution Lock', !locked, locked ? 'Expediente bloqueado por otra ejecución' : undefined);
        } catch (e: any) {
            addRule('Execution Lock', false, `Fallo verificando lock: ${e.message}`);
        }

        // 3. Evidence PDF Checks
        let pdfSource = '';
        for (const op of plan.operations) {
            if (op.type === 'MOVE_PDF') pdfSource = op.payload.source;
        }

        if (pdfSource) {
            try {
                const pdfExists = await this.fs.exists(pdfSource);
                addRule('PDF Exists', pdfExists, !pdfExists ? `No se encontró el PDF en ${pdfSource}` : undefined);
                
                if (pdfExists) {
                    const pdfHash = await this.fs.calculateHash(pdfSource);
                    addRule('PDF Hash Match', pdfHash === plan.expectedPdfHash, pdfHash !== plan.expectedPdfHash ? `Hash esperado ${plan.expectedPdfHash}, actual ${pdfHash}` : undefined);
                }
            } catch (e: any) {
                // If it's a permission or network error
                addRule('PDF Exists', false, `Error de I/O o permisos: ${e.message}`);
                addRule('PDF Hash Match', false, 'Saltado por error de I/O');
            }
        }

        // 4. Index Checks
        try {
            const indexExists = await this.fs.exists(indicePath);
            addRule('Indice Exists', indexExists, !indexExists ? `No se encontró el índice en ${indicePath}` : undefined);
            
            if (indexExists) {
                const indexHash = await this.fs.calculateHash(indicePath);
                addRule('Indice Hash Match', indexHash === expectedIndiceHash, indexHash !== expectedIndiceHash ? `Hash esperado ${expectedIndiceHash}, actual ${indexHash}` : undefined);
            }
        } catch (e: any) {
             addRule('Indice Exists', false, `Error de I/O o permisos: ${e.message}`);
             addRule('Indice Hash Match', false, 'Saltado por error de I/O');
        }

        return new PreflightReport(
            success,
            new Date().toISOString(),
            plan.planHash,
            validations,
            { durationMs: performance.now() - start }
        );
    }
}
