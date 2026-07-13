import { Document } from '@lexia/domain';
import { ValidationRule, ValidationReport, ValidationIssue } from '../contracts/index.js';

export class DocumentValidator {
  private rules: ValidationRule[];

  constructor(rules: ValidationRule[]) {
    this.rules = rules;
  }

  validate(document: Document): ValidationReport {
    const issues: ValidationIssue[] = [];
    
    for (const rule of this.rules) {
      const issue = rule.validate(document);
      if (issue) {
        issues.push(issue);
      }
    }

    const hasErrors = issues.some(i => i.severity === 'ERROR');
    const hasWarnings = issues.some(i => i.severity === 'WARNING');

    return {
      documentId: document.identity.id,
      issues,
      hasErrors,
      hasWarnings
    };
  }
}
