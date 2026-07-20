import * as crypto from 'crypto';
import { DecisionEvent } from '../ApprovalWorkflow/ApprovalContracts.js';

export interface PlanOperation {
    type: 'MOVE_PDF' | 'UPDATE_INDEX';
    description: string;
    payload: any;
}

export class ExecutionPlan {
    public readonly planHash: string;
    
    constructor(
        public readonly planId: string,
        public readonly traceId: string,
        public readonly decisionEventId: string,
        public readonly expectedPdfHash: string,
        public readonly engineVersion: string,
        public readonly operations: ReadonlyArray<PlanOperation>,
        public readonly createdAt: string
    ) {
        this.planHash = this.calculateHash();
        Object.freeze(this.operations);
        Object.freeze(this);
    }

    private calculateHash(): string {
        const payload = JSON.stringify({
            planId: this.planId,
            traceId: this.traceId,
            decisionEventId: this.decisionEventId,
            expectedPdfHash: this.expectedPdfHash,
            engineVersion: this.engineVersion,
            operations: this.operations
        });
        return crypto.createHash('sha256').update(payload).digest('hex');
    }
}

export class ExecutionPlanBuilder {
    public static buildFromDecision(event: DecisionEvent): ExecutionPlan {
        if (!event || !event.decisionFuncionario) throw new Error('Invalid DecisionEvent');
        if (event.decisionFuncionario.accion !== 'APROBAR') throw new Error('Solo se puede planificar un evento APROBADO');

        const operations: PlanOperation[] = [];
        const expId = event.decisionFuncionario.expedienteId;
        const consecutivo = event.decisionFuncionario.consecutivo;

        operations.push({
            type: 'MOVE_PDF',
            description: `Mover PDF ${event.documentId} a expediente ${expId}`,
            payload: {
                source: event.documentId,
                target: `/${expId}/${consecutivo}_Evidencia.pdf`
            }
        });

        operations.push({
            type: 'UPDATE_INDEX',
            description: `Actualizar índice del expediente ${expId}`,
            payload: {
                expedienteId: expId,
                consecutivo: consecutivo,
                pdfHash: event.hash
            }
        });

        const pdfHash = (event.propuestaLexia as any).investigationReportSnapshot?.extractorEvidence?.hash || 'unknown_hash';

        return new ExecutionPlan(
            crypto.randomUUID(),
            'trace_id_placeholder', // Should probably come from context, but we mock for now
            event.eventId,
            pdfHash,
            event.propuestaLexia.engineVersion,
            operations,
            new Date().toISOString()
        );
    }
}
