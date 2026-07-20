import * as fs from 'fs';
import * as path from 'path';

export interface LocatorResult {
    indiceId: string;
    ruta: string;
    nombre: string;
    error?: string;
}

export class IndiceLocator {
    /**
     * Busca el índice electrónico en una ruta.
     * Ignora el nombre de archivo exacto y prioriza heurísticas,
     * pero para este MVP, buscará el primer .xlsx y verificará si su nombre contiene "indice"
     * o buscará patrones. Si encuentra más de uno, lanzará error MULTIPLES_INDICES.
     */
    public async locate(rutaExpediente: string): Promise<LocatorResult> {
        if (!fs.existsSync(rutaExpediente)) {
            return { indiceId: '', ruta: '', nombre: '', error: 'INDICE_NO_ENCONTRADO' };
        }

        const stat = fs.statSync(rutaExpediente);
        let files: string[] = [];

        if (stat.isDirectory()) {
            files = fs.readdirSync(rutaExpediente)
                .filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~'));
        } else if (stat.isFile() && rutaExpediente.toLowerCase().endsWith('.xlsx')) {
            files = [path.basename(rutaExpediente)];
            rutaExpediente = path.dirname(rutaExpediente);
        } else {
             return { indiceId: '', ruta: '', nombre: '', error: 'INDICE_NO_ENCONTRADO' };
        }

        if (files.length === 0) {
            return { indiceId: '', ruta: '', nombre: '', error: 'INDICE_NO_ENCONTRADO' };
        }

        // Ideally, we'd open all to check headers, but that's slow.
        // As a heuristic for the MVP, if there are multiple xlsx files that contain "indice" in their name, it's ambiguous.
        const probableIndexes = files.filter(f => f.toLowerCase().includes('indice'));

        if (probableIndexes.length > 1) {
             return { indiceId: '', ruta: '', nombre: '', error: 'MULTIPLES_INDICES' };
        }

        // If no 'indice' in name but there's only 1 xlsx file, it might be the index. Let's assume it is if there's exactly 1.
        // If there are multiple and NONE have 'indice', we can't decide without opening. (We return MULTIPLES_INDICES).
        let targetFile = '';
        if (probableIndexes.length === 1) {
            targetFile = probableIndexes[0];
        } else if (files.length === 1) {
            targetFile = files[0];
        } else {
             return { indiceId: '', ruta: '', nombre: '', error: 'MULTIPLES_INDICES' };
        }

        const absolutePath = path.join(rutaExpediente, targetFile);

        return {
            indiceId: Buffer.from(absolutePath).toString('base64'),
            ruta: absolutePath,
            nombre: targetFile
        };
    }
}
