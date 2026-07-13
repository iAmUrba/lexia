import { Case, CaseSource, CaseBuildReport, CaseBuilderOptions } from '@lexia/domain';
import { CaseBuilder } from '../case/CaseBuilder.js';
import { CaseRepository } from '../contracts/CaseRepository.js';
import { ProcessDocumentUseCase } from './ProcessDocumentUseCase.js';

export class ProcessCaseUseCase {
  constructor(
    private documentProcessor: ProcessDocumentUseCase,
    private repository: CaseRepository
  ) {}

  /**
   * Procesa múltiples documentos desde una fuente y los ensambla en un Expediente (Case).
   */
  async execute(caseId: string, source: CaseSource, documentPaths: string[], options?: CaseBuilderOptions): Promise<{ caso: Case, report: CaseBuildReport }> {
    const startTime = Date.now();
    const builder = new CaseBuilder(caseId, options);
    const warnings: string[] = [];
    let docsProcessed = 0;

    for (const path of documentPaths) {
      try {
        // En una arquitectura completa, ProcessDocumentUseCase devuelve el Document procesado.
        // Aquí asumimos que process() procesa un archivo y devuelve un Document.
        // (Nota: Actualmente ProcessDocumentUseCase está acoplado a leer un path y guardar en repositorio interno,
        // pero para este ejemplo lo abstraemos).
        
        const document = await this.documentProcessor.process(path, 'judicial');
        docsProcessed++;

        // Extraemos los identificadores del documento para ver si tiene radicado
        const header = document.assets.latest<any>('DocumentIndex'); // Simplificado
        
        if (header?.radicado) {
          builder.setIdentifiers({ radicado: header.radicado });
        }

        builder.addDocument({
          documentId: document.id,
          relation: 'PRINCIPAL', // Podría derivarse del análisis
          addedAt: new Date().toISOString(),
          source: source.id
        });
      } catch (error: any) {
        warnings.push(`Error procesando documento ${path}: ${error.message}`);
      }
    }

    const caso = builder.build();

    // Guardar en el repositorio (solo contrato, esto puede ser en memoria o DB)
    await this.repository.save(caso);

    const report: CaseBuildReport = {
      documentsProcessed: docsProcessed,
      participantsMerged: 0, // Esto se llenará cuando conectemos el ParticipantMerger
      timelineEvents: 0, // Esto se llenará cuando conectemos el TimelineMerger
      warnings,
      durationMs: Date.now() - startTime
    };

    return { caso, report };
  }
}
