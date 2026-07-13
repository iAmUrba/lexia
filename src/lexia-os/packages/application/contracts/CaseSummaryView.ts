import { CaseHeaderView } from './CaseHeaderView.js';
import { ValidationReport } from './ValidationReport.js';
import { TimelineOperation } from '@lexia/domain';

export interface CaseSummaryView {
  readonly header: CaseHeaderView;
  readonly people: string[];
  readonly timeline: TimelineOperation[];
  readonly warnings: string[];
  readonly metrics?: any;
}
