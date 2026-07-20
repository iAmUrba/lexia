import { ConsecutivoProposal, IndiceData } from './contracts.js';

export class ConsecutivoResolver {
    /**
     * Calcula la propuesta del próximo consecutivo analizando los registros.
     */
    public resolve(data: IndiceData, previousWarnings: string[] = []): ConsecutivoProposal {
        const warnings = [...previousWarnings];
        const huecos: number[] = [];
        
        let lastValidConsecutivo = 0;
        let lastDocumentName = '';
        
        // Filtrar registros vacíos para la lógica de saltos lógicos
        const records = data.registros.filter(r => r.consecutivo !== null && r.consecutivo !== '');

        for (const record of records) {
            const currentVal = Number(record.consecutivo);
            
            // Si no es un número (ej. "002A"), ignorarlo para el conteo estricto, 
            // pero el validator ya lo reportó.
            if (isNaN(currentVal)) {
                continue;
            }

            if (lastValidConsecutivo > 0 && currentVal > lastValidConsecutivo + 1) {
                // Hueco detectado
                for (let i = lastValidConsecutivo + 1; i < currentVal; i++) {
                    huecos.push(i);
                }
                if (!warnings.includes('HUECO_CONSECUTIVO')) {
                    warnings.push('HUECO_CONSECUTIVO');
                }
            }

            if (currentVal > lastValidConsecutivo) {
                lastValidConsecutivo = currentVal;
                lastDocumentName = record.nombreDocumento;
            }
        }

        const siguienteConsecutivo = lastValidConsecutivo > 0 ? lastValidConsecutivo + 1 : 1;

        return {
            siguienteConsecutivo,
            documentoAnterior: lastDocumentName || null,
            existenHuecos: huecos.length > 0,
            huecos,
            warnings
        };
    }
}
