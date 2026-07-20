import { IFileSystem } from './Contracts/IFileSystem.js';
import { PlanOperation } from './ExecutionPlanBuilder.js';
import { InfrastructureError, InfrastructureErrorType } from './Contracts/InfrastructureError.js';
import * as crypto from 'crypto';

export interface FileDescriptor {
    source: string;
    target: string;
    expectedHash: string;
}

export interface PdfMoverResult {
    success: boolean;
    status: 'COMPLETED' | 'INTEGRITY_ERROR' | 'COPY_DONE_DELETE_FAILED' | 'FAILED' | 'SKIPPED';
    hashBefore: string;
    hashAfter: string;
    durationMs: number;
    error?: string;
}

export class PdfMover {
    constructor(private fs: IFileSystem) {}

    public async execute(operation: PlanOperation, traceId: string): Promise<PdfMoverResult> {
        if (operation.type !== 'MOVE_PDF') {
            throw new Error('PdfMover only supports MOVE_PDF operations');
        }

        const start = performance.now();
        const descriptor = operation.payload as FileDescriptor;
        const options = { traceId };

        try {
            // Check if source exists
            const sourceExists = await this.fs.exists(descriptor.source, options);
            if (!sourceExists) {
                // Si el origen no existe, podría ya haber sido movido en un intento anterior (Idempotencia en compensación)
                const targetExists = await this.fs.exists(descriptor.target, options);
                if (targetExists) {
                    const targetHash = await this.fs.calculateHash(descriptor.target, options);
                    if (targetHash === descriptor.expectedHash) {
                        return { success: true, status: 'SKIPPED', hashBefore: descriptor.expectedHash, hashAfter: targetHash, durationMs: performance.now() - start };
                    }
                }
                throw new Error('El archivo origen no existe y no se encontró en el destino válido');
            }

            // Verify source integrity before moving
            const sourceHash = await this.fs.calculateHash(descriptor.source, options);
            if (sourceHash !== descriptor.expectedHash) {
                return { success: false, status: 'INTEGRITY_ERROR', hashBefore: sourceHash, hashAfter: '', durationMs: performance.now() - start, error: 'Source hash mismatch' };
            }

            // Target exists?
            const targetExists = await this.fs.exists(descriptor.target, options);
            if (targetExists) {
                throw new Error('El destino ya existe');
            }

            // 1. Copy
            await this.fs.copyFile(descriptor.source, descriptor.target, options);

            // 2. Read-after-copy verify
            const targetHash = await this.fs.calculateHash(descriptor.target, options);
            if (targetHash !== descriptor.expectedHash) {
                // If it fails verification, we delete the target and abort
                await this.fs.deleteFile(descriptor.target, options);
                return { success: false, status: 'INTEGRITY_ERROR', hashBefore: sourceHash, hashAfter: targetHash, durationMs: performance.now() - start, error: 'Target hash mismatch after copy' };
            }

            // 3. Delete source
            try {
                await this.fs.deleteFile(descriptor.source, options);
            } catch (e: any) {
                return { success: false, status: 'COPY_DONE_DELETE_FAILED', hashBefore: sourceHash, hashAfter: targetHash, durationMs: performance.now() - start, error: `Failed to delete source: ${e.message}` };
            }

            return {
                success: true,
                status: 'COMPLETED',
                hashBefore: sourceHash,
                hashAfter: targetHash,
                durationMs: performance.now() - start
            };
        } catch (e: any) {
            return {
                success: false,
                status: 'FAILED',
                hashBefore: '',
                hashAfter: '',
                durationMs: performance.now() - start,
                error: e.message
            };
        }
    }

    public async compensate(operation: PlanOperation, traceId: string): Promise<PdfMoverResult> {
        const start = performance.now();
        const descriptor = operation.payload as FileDescriptor;
        const options = { traceId };

        try {
            // Restore means moving from target back to source
            const targetExists = await this.fs.exists(descriptor.target, options);
            if (!targetExists) {
                // If target doesn't exist, maybe it was never moved. Check if source is fine.
                const sourceExists = await this.fs.exists(descriptor.source, options);
                if (sourceExists) {
                    const sourceHash = await this.fs.calculateHash(descriptor.source, options);
                    return { success: true, status: 'SKIPPED', hashBefore: sourceHash, hashAfter: sourceHash, durationMs: performance.now() - start };
                }
                throw new Error('Ambos origen y destino son inexistentes durante la compensación');
            }

            const targetHash = await this.fs.calculateHash(descriptor.target, options);
            if (targetHash !== descriptor.expectedHash) {
                 return { success: false, status: 'INTEGRITY_ERROR', hashBefore: targetHash, hashAfter: '', durationMs: performance.now() - start, error: 'El archivo a restaurar no coincide con el hash original' };
            }

            // Copy back
            await this.fs.copyFile(descriptor.target, descriptor.source, options);

            // Verify
            const restoredHash = await this.fs.calculateHash(descriptor.source, options);
            if (restoredHash !== descriptor.expectedHash) {
                await this.fs.deleteFile(descriptor.source, options); // cleanup bad restore
                return { success: false, status: 'INTEGRITY_ERROR', hashBefore: targetHash, hashAfter: restoredHash, durationMs: performance.now() - start, error: 'Hash no coincide tras restaurar' };
            }

            // Delete target
            try {
                await this.fs.deleteFile(descriptor.target, options);
            } catch (e: any) {
                 return { success: false, status: 'COPY_DONE_DELETE_FAILED', hashBefore: targetHash, hashAfter: restoredHash, durationMs: performance.now() - start, error: `Fallo al limpiar destino tras restaurar: ${e.message}` };
            }

            return { success: true, status: 'COMPLETED', hashBefore: targetHash, hashAfter: restoredHash, durationMs: performance.now() - start };
        } catch (e: any) {
            return { success: false, status: 'FAILED', hashBefore: '', hashAfter: '', durationMs: performance.now() - start, error: e.message };
        }
    }
}
