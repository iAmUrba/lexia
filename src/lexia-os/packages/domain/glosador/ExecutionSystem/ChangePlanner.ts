import { DecisionEvent } from '../../ApprovalWorkflow/ApprovalContracts.js';
import { ExecutionPlan, ExecutionOperation } from '../Contracts/ExecutionContracts.js';
import * as crypto from 'crypto';

export class ChangePlanner {
    public createPlan(decision: DecisionEvent, expectedPdfHash: string, expectedIndexHash: string): ExecutionPlan {
        if (decision.decisionFuncionario.accion !== 'APROBAR') {
            throw new Error('Solo se pueden crear planes para decisiones aprobadas');
        }

        const operations: ExecutionOperation[] = [];

        // 1. Excel Update
        operations.push({
            type: 'EXCEL_UPDATE',
            targetPath: decision.propuestaLexia.expedienteId + '/000Indice.xlsx', // Simplified logic for demo
            consecutivoAsignado: decision.decisionFuncionario.consecutivo,
            nombreDocumento: 'Documento Asignado'
        });

        // 2. PDF Move
        operations.push({
            type: 'PDF_MOVE',
            sourcePath: decision.documentId,
            destinationPath: `${decision.propuestaLexia.expedienteId}/${decision.decisionFuncionario.consecutivo}_Documento.pdf`
        });

        const planId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        return {
            planId,
            decisionEventId: decision.eventId,
            expectedPdfHash,
            expectedIndexHash,
            expectedEngineVersion: decision.propuestaLexia.engineVersion,
            schemaVersion: '1.0',
            operations,
            createdAt
        };
    }
}
