import { IExcelAdapter, IIndiceReader, IndiceData, IndiceRegistro, SheetData } from './contracts.js';

export class IndiceReader implements IIndiceReader {
    constructor(private adapter: IExcelAdapter) {}

    public async read(path: string): Promise<IndiceData> {
        const wbData = await this.adapter.open(path);
        const hash = await wbData.getHash();

        if (wbData.sheets.length === 0) {
            throw new Error('NO_SHEETS');
        }

        // Caso 14: Buscar la hoja correcta
        let targetSheet: SheetData | undefined;
        
        // 1. Heurística 1: Nombre de la hoja contiene "indice"
        targetSheet = wbData.sheets.find(s => s.name.toLowerCase().includes('indice'));

        // 2. Heurística 2: Si no hay por nombre, buscar la hoja con los encabezados esperados (ej. "consecutivo", "nombre")
        if (!targetSheet) {
            targetSheet = wbData.sheets.find(s => this.hasIndexHeaders(s));
        }

        // 3. Fallback: Primera hoja
        if (!targetSheet) {
            targetSheet = wbData.sheets[0];
        }

        const registros = this.extractRecords(targetSheet);

        return {
            metadata: {
                nombre: path.split('/').pop() || 'unknown',
                version: '1.0',
                fechaLectura: new Date().toISOString(),
                hash
            },
            registros,
            estructura: {
                formulas: targetSheet.formulasCount,
                celdasCombinadas: targetSheet.mergedCellsCount,
                hojas: wbData.sheets.map(s => s.name),
                columnas: this.extractHeaders(targetSheet),
                hasProtection: targetSheet.hasProtection
            }
        };
    }

    private hasIndexHeaders(sheet: SheetData): boolean {
        const headers = this.extractHeaders(sheet);
        const str = headers.join(' ').toLowerCase();
        return str.includes('consecutivo') || (str.includes('fecha') && str.includes('nombre'));
    }

    private extractHeaders(sheet: SheetData): string[] {
        // En un índice típico, la fila 1 o 2 tiene los encabezados.
        // Buscamos la primera fila que tenga strings.
        for (const row of sheet.rows) {
            if (row && row.length > 0) {
                const isHeader = row.some(c => c && typeof c.value === 'string');
                if (isHeader) {
                    return row.map(c => c ? c.value?.toString().toLowerCase() || '' : '');
                }
            }
        }
        return [];
    }

    private extractRecords(sheet: SheetData): IndiceRegistro[] {
        const headers = this.extractHeaders(sheet);
        const colMap = this.mapColumns(headers);
        const registros: IndiceRegistro[] = [];

        let foundHeaders = false;

        for (const row of sheet.rows) {
            if (!row || row.length === 0) continue;

            // Saltar la fila de encabezados
            const firstCell = row.find(c => c);
            if (!foundHeaders && firstCell && typeof firstCell.value === 'string') {
                 if (headers.includes(firstCell.value.toString().toLowerCase())) {
                     foundHeaders = true;
                     continue;
                 }
            }
            if (!foundHeaders) continue;

            const consecutivoCell = colMap.consecutivo !== -1 ? row[colMap.consecutivo] : undefined;
            const nombreCell = colMap.nombre !== -1 ? row[colMap.nombre] : undefined;

            // Ignorar filas completamente vacías
            if (!consecutivoCell?.value && !nombreCell?.value) {
                // Registrar hueco físico (fila vacía)
                registros.push({ consecutivo: null, nombreDocumento: '' });
                continue;
            }

            let consecutivoValue = null;
            let isFormula = false;
            let hasError = false;

            if (consecutivoCell) {
                isFormula = consecutivoCell.isFormula;
                if (isFormula && consecutivoCell.result?.error) {
                    hasError = true;
                } else if (isFormula && consecutivoCell.result) {
                    consecutivoValue = consecutivoCell.result;
                } else {
                    consecutivoValue = consecutivoCell.value;
                }
            }

            let nombreDocValue = '';
            if (nombreCell) {
                nombreDocValue = nombreCell.isFormula ? nombreCell.result?.toString() : nombreCell.value?.toString();
            }

            registros.push({
                consecutivo: consecutivoValue,
                nombreDocumento: nombreDocValue || '',
                isFormula,
                hasError
            });
        }

        return registros;
    }

    private mapColumns(headers: string[]): { consecutivo: number, nombre: number } {
        // Tolerante al desorden: buscamos por nombre
        let consecutivo = -1;
        let nombre = -1;

        headers.forEach((h, index) => {
            if (h.includes('consecutivo')) consecutivo = index;
            if (h.includes('nombre')) nombre = index;
        });

        // Si no encontramos, asumimos 0 y 1 por defecto (riesgoso, pero fallback)
        if (consecutivo === -1) consecutivo = 0;
        if (nombre === -1 && headers.length > 1) nombre = 1;

        return { consecutivo, nombre };
    }
}
