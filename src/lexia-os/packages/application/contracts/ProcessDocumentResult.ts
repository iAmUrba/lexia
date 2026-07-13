import { Document } from '@lexia/domain/document/index.js';
import { CaseHeaderView } from './CaseHeaderView.js';
import { CaseSummaryView } from './CaseSummaryView.js';
import { ValidationReport } from './Validation.js';
import { ExecutionReport } from '@lexia/engine';

export interface ProcessDocumentResult {
  document: Document;
  caseHeader: CaseHeaderView;
  caseSummary: CaseSummaryView;
  validation: ValidationReport;
  metrics: ExecutionReport;
}
