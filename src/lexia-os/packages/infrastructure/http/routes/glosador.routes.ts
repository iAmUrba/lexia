import { FastifyInstance } from 'fastify';
import { EvidenceExtractor } from '../../../domain/glosador/EvidenceSystem/EvidenceExtractor.js';
import { EvidenceResolver } from '../../../domain/glosador/EvidenceSystem/EvidenceResolver.js';
import { MicrosoftGraphStorageProvider } from '../../storage/MicrosoftGraphStorageProvider.js';
import { ReviewBuilder, DocumentReview } from '../../../domain/glosador/ReviewBuilder/ReviewBuilder.js';
import { PdfAnalyzer } from '../../../domain/glosador/PdfAnalyzer/PdfAnalyzer.js'; // Fallback temporal para la UI
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getGlobalAccessToken } from './m365.routes.js';

const __filenameServer = fileURLToPath(import.meta.url);
const __dirnameServer = path.dirname(__filenameServer);
const settingsFile = path.join(__dirnameServer, '../../../../../server/.data/settings.json');

export default async function glosadorRoutes(app: FastifyInstance) {
  app.get('/api/glosador/scan', async (request, reply) => {
    try {
      if (!fs.existsSync(settingsFile)) {
        return reply.code(400).send({ error: 'Configuración no encontrada.' });
      }

      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      const inputFolderId = settings.inputFolderId;

      if (!inputFolderId) {
        return reply.code(400).send({ error: 'La carpeta de entrada no ha sido seleccionada en Microsoft 365.' });
      }

      const token = getGlobalAccessToken();
      if (!token) {
        return reply.code(401).send({ error: 'Sesión de Microsoft 365 caducada. Por favor, conéctese de nuevo.' });
      }

      const storageProvider = new MicrosoftGraphStorageProvider(token, inputFolderId);
      const extractor = new EvidenceExtractor();
      const resolver = new EvidenceResolver(storageProvider);
      
      // Mantenemos Analyzer temporalmente porque ReviewBuilder lo usa para pintar en la UI
      const analyzer = new PdfAnalyzer();
      const builder = new ReviewBuilder();

      const fileIds = await storageProvider.listFilesInFolder(inputFolderId);
      const items: DocumentReview[] = [];
      
      for (const fileId of fileIds.slice(0, 5)) {
        let tempFilePath = '';
        try {
          tempFilePath = await storageProvider.downloadFile(fileId);
          const buffer = fs.readFileSync(tempFilePath);
          
          // Compatibilidad UI
          const analysis = await analyzer.analyze(buffer);
          
          // Extracción Avanzada de Evidencia
          // Aquí deberíamos pasarle el texto extraído. Como el PDF es binario, 
          // usaremos temporalmente el radicado o nombre extraído como texto plano para la prueba,
          // o simular un texto dummy hasta tener pdf-parse en este entorno.
          // Para el MVP asumimos que 'buffer.toString()' o el analysis anterior nos dan pistas.
          // En producción aquí iría `await pdfParse(buffer)`.
          
          const textDummyParaPruebas = (analysis.radicado || '') + ' ' + (analysis.procesado ? `Procesado: ${analysis.procesado}` : '');
          
          const evidence = extractor.extract(textDummyParaPruebas);
          const resolution = await resolver.resolve(evidence);
          
          let expedienteResult = null;
          if (resolution.status === 'READY') {
             expedienteResult = { radicado: evidence.radicados[0] || 'Desconocido', expedientePath: resolution.folderId! };
          }
          
          fs.unlinkSync(tempFilePath);

          items.push({
            ...builder.buildReview(fileId, analysis, expedienteResult, null, resolution.explanation),
            fileName: `${analysis.nombre || 'Documento_M365'}.pdf`, 
            status: resolution.status,
            actionMessage: resolution.message
          });

        } catch (fileErr) {
           console.error('Error procesando fileId:', fileId, fileErr);
           if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        }
      }

      const readyCount = items.filter(i => i.status === 'READY').length;
      const manualCount = items.filter(i => i.status === 'MANUAL_REVIEW').length;
      const notFoundCount = items.filter(i => i.status === 'NOT_FOUND').length;

      return {
        totalFound: items.length,
        ready: readyCount,
        manual: manualCount,
        notFound: notFoundCount,
        items
      };
    } catch (e) {
      app.log.error(e);
      return reply.code(500).send({ error: 'Error procesando documentos desde Microsoft Graph' });
    }
  });
}
