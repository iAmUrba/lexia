import crypto from 'crypto';
import fs from 'fs';
import { documents } from '../../../server/db/schema.js';
import { eq } from 'drizzle-orm';

export interface DuplicateResult {
    isDuplicate: boolean;
    hash: string;
    documentId: string | null;
    status: string | null;
}

export class DuplicateDetector {
    private database: any;

    constructor(database: any) {
        this.database = database;
    }
    
    /**
     * Calcula el SHA256 de un archivo en disco.
     */
    public calculateHash(filePath: string): string {
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    }

    /**
     * Verifica si el hash ya existe en la base de datos (SQLite).
     */
    public check(hash: string): DuplicateResult {
        // Consultar la base de datos local
        try {
            const existingDoc = db.select().from(documents).where(eq(documents.fileHash, hash)).get();
            
            if (existingDoc) {
                return {
                    isDuplicate: true,
                    hash: hash,
                    documentId: existingDoc.id,
                    status: existingDoc.status
                };
            }
        } catch (e) {
            // Error en base de datos, abortar con error
            console.error('Error al verificar duplicidad en SQLite', e);
            throw e;
        }

        return {
            isDuplicate: false,
            hash: hash,
            documentId: null,
            status: null
        };
    }
}
