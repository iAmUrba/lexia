import { IFileSystem } from './Contracts/IFileSystem.js';
import { PlanOperation } from './ExecutionPlanBuilder.js';
import * as crypto from 'crypto';

export interface ExcelWriteResult {
    success: boolean;
    cellsModified: number;
    hashBefore: string;
    hashAfter: string;
    durationMs: number;
    error?: string;
}

export interface IExcelAdapter {
    readCell(buffer: Buffer, sheetName: string, cellRef: string): string;
    writeCell(buffer: Buffer, sheetName: string, cellRef: string, value: string): Buffer;
}

export class ExcelWriter {
    constructor(
        private fs: IFileSystem,
        private excelAdapter: IExcelAdapter
    ) {}

    public async execute(operation: PlanOperation, indexPath: string): Promise<ExcelWriteResult> {
        if (operation.type !== 'UPDATE_INDEX') {
            throw new Error('ExcelWriter only supports UPDATE_INDEX operations');
        }

        const start = performance.now();
        const { consecutivo, pdfHash } = operation.payload;
        
        // For demonstration, we assume consecutivo maps directly to a row. E.g., '001' -> row 2.
        const rowIndex = parseInt(consecutivo, 10) + 1;
        const sheetName = 'Indice';
        const consecutivoCell = `A${rowIndex}`;
        const hashCell = `B${rowIndex}`;

        try {
            const hashBefore = await this.fs.calculateHash(indexPath);
            const bufferBefore = await this.fs.read(indexPath);
            
            // Validate the file isn't protected/locked (mock logic in adapter will throw if so)
            // Modify
            let bufferAfter = this.excelAdapter.writeCell(bufferBefore, sheetName, consecutivoCell, consecutivo);
            bufferAfter = this.excelAdapter.writeCell(bufferAfter, sheetName, hashCell, pdfHash);

            // Write back
            await this.fs.write(indexPath, bufferAfter);

            // Re-read for immediate verification
            const verifyBuffer = await this.fs.read(indexPath);
            const verifyConsecutivo = this.excelAdapter.readCell(verifyBuffer, sheetName, consecutivoCell);
            const verifyHash = this.excelAdapter.readCell(verifyBuffer, sheetName, hashCell);

            if (verifyConsecutivo !== consecutivo || verifyHash !== pdfHash) {
                throw new Error('Read-after-write verification failed: values do not match');
            }

            const hashAfter = await this.fs.calculateHash(indexPath);

            return {
                success: true,
                cellsModified: 2,
                hashBefore,
                hashAfter,
                durationMs: performance.now() - start
            };

        } catch (e: any) {
            return {
                success: false,
                cellsModified: 0,
                hashBefore: '',
                hashAfter: '',
                durationMs: performance.now() - start,
                error: e.message
            };
        }
    }
}
