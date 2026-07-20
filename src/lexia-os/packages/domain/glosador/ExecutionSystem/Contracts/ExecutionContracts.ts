export enum ExecutionState {
    PENDING = 'PENDING',
    PREFLIGHT_OK = 'PREFLIGHT_OK',
    EXCEL_DONE = 'EXCEL_DONE',
    PDF_DONE = 'PDF_DONE',
    AUDIT_DONE = 'AUDIT_DONE',
    COMMITTED = 'COMMITTED',
    ROLLBACK_IN_PROGRESS = 'ROLLBACK_IN_PROGRESS',
    ROLLBACK_DONE = 'ROLLBACK_DONE',
    COMMIT_PENDING_AUDIT = 'COMMIT_PENDING_AUDIT'
}

export interface ExecutionLock {
    owner: string;
    startedAt: string;
    expiresAt: string;
    heartbeat: string;
}

export interface ExecutionPlan {
    planId: string;
    decisionEventId: string;
    expectedPdfHash: string;
    expectedIndexHash: string;
    expectedEngineVersion: string;
    schemaVersion: string;
    operations: ExecutionOperation[];
    createdAt: string;
}

export type ExecutionOperation = ExcelUpdateOperation | PdfMoveOperation;

export interface ExcelUpdateOperation {
    type: 'EXCEL_UPDATE';
    targetPath: string;
    consecutivoAsignado: number;
    nombreDocumento: string;
}

export interface PdfMoveOperation {
    type: 'PDF_MOVE';
    sourcePath: string;
    destinationPath: string;
}

export interface ExecutionReport {
    executionId: string;
    planId: string;
    decisionEventId: string;
    state: ExecutionState;
    pdfHashBefore: string;
    pdfHashAfter: string;
    indexHashBefore: string;
    indexHashAfter: string;
    startedAt: string;
    completedAt: string | null;
    executedBy: string;
    durationMs: number;
}
