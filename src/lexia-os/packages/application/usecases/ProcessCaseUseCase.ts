import { Case, CaseSource, CaseBuilderOptions, MergeReport } from '@lexia/domain';
import { CaseBuilder } from '../case/CaseBuilder.js';
import { CaseRepository } from '../contracts/CaseRepository.js';
import { ProcessDocumentUseCase } from './ProcessDocumentUseCase.js';
import { TimelineMerger } from '../case/mergers/TimelineMerger.js';
import { ParticipantMerger } from '../case/mergers/ParticipantMerger.js';
import { CaseGraphBuilder, CaseGraph } from '../case/CaseGraphBuilder.js';
import { CaseProjector } from '../projectors/CaseProjector.js';
import { CaseSummaryView } from '../contracts/CaseSummaryView.js';

export interface ProcessCaseResult {
  readonly caso: Case;
  readonly summary: CaseSummaryView;
  readonly graph: CaseGraph;
  readonly reports: {
    readonly timeline: MergeReport;
    readonly participants: MergeReport;
    readonly documentsProcessed: number;
    readonly warnings: string[];
  };
  readonly durationMs: number;
}

export class ProcessCaseUseCase {
  constructor(
    private documentProcessor: ProcessDocumentUseCase,
    private repository: CaseRepository
  ) {}

  /**
   * Procesa múltiples documentos desde una fuente, los fusiona
   * y devuelve el resultado completo End-to-End.
   */
  async execute(caseId: string, source: CaseSource, documentPaths: string[], options?: CaseBuilderOptions): Promise<ProcessCaseResult> {
    const startTime = Date.now();
    const builder = new CaseBuilder(caseId, options);
    const warnings: string[] = [];
    let docsProcessed = 0;

    let globalParticipants: any[] = [];
    const timelines: any[] = [];

    let participantMergeReport: MergeReport = { merged: 0, created: 0, ignored: 0, conflicts: 0, durationMs: 0 };
    let timelineMergeReport: MergeReport = { merged: 0, created: 0, ignored: 0, conflicts: 0, durationMs: 0 };

    for (const path of documentPaths) {
      try {
        const document = await this.documentProcessor.process(path, 'judicial');
        docsProcessed++;

        const header = document.assets.latest<any>('DocumentIndex');
        if (header?.radicado) {
          builder.setIdentifiers({ radicado: header.radicado });
        }

        builder.addDocument({
          documentId: document.id,
          relation: 'PRINCIPAL',
          addedAt: new Date().toISOString(),
          source: source.id
        });

        // 1. Participant Merging Incremental
        const participantsAsset = document.assets.latest<any>('ParticipantsAsset');
        if (participantsAsset?.participants) {
          const mergeResult = ParticipantMerger.merge(globalParticipants, participantsAsset.participants);
          globalParticipants = mergeResult.participants;
          // Acumular reporte (simplificado)
          participantMergeReport = {
            merged: participantMergeReport.merged + mergeResult.report.merged,
            created: participantMergeReport.created + mergeResult.report.created,
            ignored: participantMergeReport.ignored + mergeResult.report.ignored,
            conflicts: participantMergeReport.conflicts + mergeResult.report.conflicts,
            durationMs: participantMergeReport.durationMs + mergeResult.report.durationMs
          };
        }

        // 2. Acumular Timelines
        if (document.timeline) {
          timelines.push(document.timeline);
        }

      } catch (error: any) {
        warnings.push(`Error procesando documento ${path}: ${error.message}`);
      }
    }

    // 3. Fusionar Timeline global
    const timelineResult = TimelineMerger.merge(timelines, { strategy: 'DATE_THEN_TIMESTAMP', tiebreaker: 'DOCUMENT_ID' });
    timelineMergeReport = timelineResult.report;

    // 4. Construir el Case
    let caso = builder.build();
    caso = {
      ...caso,
      participants: globalParticipants,
      timeline: timelineResult.timeline
    };

    await this.repository.save(caso);

    // 5. Construir derivados
    const graph = CaseGraphBuilder.build(caso);
    const summary = CaseProjector.project(caso);

    return {
      caso,
      summary,
      graph,
      reports: {
        timeline: timelineMergeReport,
        participants: participantMergeReport,
        documentsProcessed: docsProcessed,
        warnings
      },
      durationMs: Date.now() - startTime
    };
  }
}
