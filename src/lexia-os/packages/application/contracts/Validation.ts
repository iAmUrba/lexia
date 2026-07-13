import { Document, FieldEvidence } from '@lexia/domain';

export type ValidationSeverity = 'INFO' | 'WARNING' | 'ERROR';

export interface ValidationIssue {
  readonly code: string;
  readonly severity: ValidationSeverity;
  readonly message: string;
  readonly relatedAsset?: string;
  readonly evidence?: FieldEvidence[];
}

export interface ValidationReport {
  readonly documentId: string;
  readonly issues: ValidationIssue[];
  readonly hasErrors: boolean;
  readonly hasWarnings: boolean;
}

export interface ValidationRule {
  validate(document: Document): ValidationIssue | null;
}
