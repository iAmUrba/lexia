import { DocumentModel } from './contracts.js';

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface DocumentModelValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

export class DocumentModelValidator {
  validate(model: DocumentModel): DocumentModelValidationResult {
    const issues: ValidationIssue[] = [];

    // Basic structure validation
    if (!model.title || model.title.trim() === '') {
      issues.push({ field: 'title', message: 'Title is required' });
    }

    if (!model.fields) {
      issues.push({ field: 'fields', message: 'Fields object is required' });
    }

    // Specific validation based on required fields could be added dynamically 
    // or by overriding this method for specific document types, 
    // but a generic validator checks the core structure.

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
