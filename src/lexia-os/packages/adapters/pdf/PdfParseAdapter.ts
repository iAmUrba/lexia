import { ExtractedPdfData, PdfExtractor } from './PdfExtractor.js';
// @ts-ignore
import pdfParse from 'pdf-parse';

export class PdfParseAdapter implements PdfExtractor {
  async extract(buffer: Buffer): Promise<ExtractedPdfData> {
    try {
      const data = await pdfParse(buffer);
      
      return {
        text: data.text || '',
        numpages: data.numpages || 1,
        metadata: {
          author: data.info?.Author,
          title: data.info?.Title,
          creator: data.info?.Creator,
          producer: data.info?.Producer,
          creationDate: data.info?.CreationDate
        },
        // pdf-parse lanzaría error usualmente si está encriptado, 
        // pero lo marcamos como false si logró pasar
        isEncrypted: false 
      };
    } catch (error: any) {
      if (error.message && error.message.includes('Password')) {
        throw new Error('PDF is encrypted');
      }
      throw error;
    }
  }
}
