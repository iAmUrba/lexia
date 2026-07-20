import ExcelJS from 'exceljs';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { IExcelAdapter, WorkbookData, SheetData } from '../contracts.js';

export class ExcelJSAdapter implements IExcelAdapter {
    public async open(filePath: string): Promise<WorkbookData> {
        // Calculate hash to guarantee zero writes on the original file
        const hash = await this.calculateHash(filePath);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const sheets: SheetData[] = [];
        
        workbook.eachSheet((worksheet, sheetId) => {
            const rows: any[][] = [];
            
            worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                const rowData: any[] = [];
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const cellData: any = {
                        value: cell.value,
                        type: cell.type,
                        formula: cell.formula,
                        isFormula: cell.type === ExcelJS.ValueType.Formula,
                        result: cell.result,
                        address: cell.address
                    };
                    rowData[colNumber - 1] = cellData;
                });
                rows[rowNumber - 1] = rowData;
            });

            // Extract formulas and merged cells counts
            let formulasCount = 0;
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    if (cell.type === ExcelJS.ValueType.Formula) {
                        formulasCount++;
                    }
                });
            });

            // If worksheet state is 'hidden' or 'veryHidden', etc, we could log it
            sheets.push({
                name: worksheet.name,
                rows: rows,
                formulasCount: formulasCount,
                mergedCellsCount: Object.keys(worksheet.model.merges || {}).length,
                // Checking for protection (a basic check in ExcelJS)
                hasProtection: worksheet.model.sheetProtection != null
            });
        });

        return {
            sheets,
            getHash: async () => hash
        };
    }

    private calculateHash(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            stream.on('error', err => reject(err));
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
        });
    }
}
