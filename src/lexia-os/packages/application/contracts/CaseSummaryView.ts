import { CaseHeaderView } from './CaseHeaderView.js';
import { ValidationReport } from './ValidationReport.js';
import { TimelineOperation } from '@lexia/domain';

export interface ParticipantView {
  readonly participantId: string;
  readonly name: string;
  readonly roles: string[];
  readonly mentionCount: number;
  readonly confidence: number;
}

export interface CaseSummaryView {
  readonly header: CaseHeaderView;
  readonly documentsProcessed: number;
  readonly participants: ParticipantView[];
  readonly timeline: TimelineOperation[];
  readonly observations: string[]; // Separado del contenido
  readonly quality?: any;
  readonly validation?: any;
  readonly statistics?: any;
}
