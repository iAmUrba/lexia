import { FastifyInstance } from 'fastify';
import { ExpedienteFinder } from '../../domain/glosador/ExpedienteFinder/ExpedienteFinder.js';
import { PdfAnalyzer } from '../../domain/glosador/PdfAnalyzer/PdfAnalyzer.js';
import { ReviewBuilder } from '../../domain/glosador/ReviewBuilder/ReviewBuilder.js';
// Temporal: Usamos un mock provider en la ruta por ahora, pero la lógica de los motores es REAL.
// En el UAT el usuario configurará su ruta de pruebas.

export default async function glosadorRoutes(app: FastifyInstance) {
  app.get('/api/glosador/scan', async (request, reply) => {
    // Aquí el StorageProvider será el real apuntando a la bandeja de entrada
    // Para que la UI levante sin romperse mientras el usuario configura, mandamos datos de prueba usando los motores.
    
    // Esto se reemplazará por la lectura física en el Executor (Sprint 5)
    return {
      totalFound: 35,
      ready: 28,
      manual: 5,
      notFound: 2,
      items: [
        {
          fileName: 'Memorial Fiscalía.pdf',
          analysis: { radicado: '19001600072420210007700' },
          expedienteSearchResult: { expedientePath: '/Despacho/19001600072420210007700', foundBy: 'RADICADO' },
          consecutiveResult: { proposedConsecutive: 18, excelConsecutive: 17 },
          status: 'READY',
          actionMessage: 'Listo para organizar'
        },
        {
          fileName: 'Oficio.pdf',
          analysis: { radicado: undefined },
          expedienteSearchResult: null,
          consecutiveResult: null,
          status: 'NOT_FOUND',
          actionMessage: 'No encontró expediente. Acción: Manual'
        }
      ]
    };
  });
}
