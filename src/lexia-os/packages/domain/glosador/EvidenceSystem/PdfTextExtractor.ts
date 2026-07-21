import pdf from 'pdf-parse';

export class PdfTextExtractor {
    /**
     * Extrae el texto de un buffer de PDF.
     * Soporta principalmente PDFs con texto seleccionable (Nativo).
     * @param buffer El buffer del archivo PDF
     * @returns El string completo con el texto extraído
     */
    public async extractText(buffer: Buffer): Promise<string> {
        try {
            const data = await pdf(buffer);
            return data.text || '';
        } catch (error: any) {
            console.error('Error extrayendo texto del PDF:', error.message);
            throw new Error(`Fallo al extraer texto del PDF: ${error.message}`);
        }
    }
}
