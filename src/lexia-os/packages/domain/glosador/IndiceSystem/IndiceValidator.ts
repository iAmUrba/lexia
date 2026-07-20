import { IndiceData } from './contracts.js';

export class IndiceValidator {
    /**
     * Valida la estructura y contenido del índice, retornando un array de advertencias/errores.
     * No repara absolutamente nada. Solo informa.
     */
    public validate(data: IndiceData): string[] {
        const warnings: string[] = [];

        // 1. Verificar si hay fórmulas dañadas (ej. #REF!)
        const hasBrokenFormulas = data.registros.some(r => r.hasError);
        if (hasBrokenFormulas) {
            warnings.push('FORMULA_INVALIDA');
        }

        // 2. Verificar si no hay fórmulas en la columna de consecutivos
        // Asumimos que un índice bien formateado usaría fórmulas para los consecutivos.
        // Si hay registros, pero ninguno tiene isFormula = true.
        const validRecords = data.registros.filter(r => r.consecutivo !== null && r.consecutivo !== '');
        if (validRecords.length > 0) {
            const hasAnyFormula = validRecords.some(r => r.isFormula);
            if (!hasAnyFormula) {
                warnings.push('SIN_FORMULAS');
            }
        }

        // 3. Verificar celdas combinadas inesperadas (heurística simple para MVP)
        if (data.estructura.celdasCombinadas > 0) {
             warnings.push('CELDAS_COMBINADAS_INESPERADAS');
        }

        // 4. Huecos físicos (filas vacías)
        const hasEmptyRows = data.registros.some(r => r.consecutivo === null && r.nombreDocumento === '');
        if (hasEmptyRows) {
            warnings.push('FILAS_VACIAS');
        }

        // 5. Consecutivos no numéricos
        const hasNonNumeric = validRecords.some(r => {
             const num = Number(r.consecutivo);
             return isNaN(num);
        });
        if (hasNonNumeric) {
            warnings.push('CONSECUTIVOS_NO_NUMERICOS');
        }

        return warnings;
    }
}
