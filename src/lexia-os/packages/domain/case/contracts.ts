import { Case } from './models.js';

export interface CaseSource {
  readonly id: string;
  readonly type: 'FOLDER' | 'ZIP' | 'FILE_LIST';
  readonly path: string;
}

export interface CaseBuildReport {
  readonly documentsProcessed: number;
  readonly participantsMerged: number;
  readonly timelineEvents: number;
  readonly warnings: string[];
  readonly durationMs: number;
}

export interface CaseBuilderOptions {
  readonly deduplicateDocuments?: boolean;
  readonly allowMultipleRadicados?: boolean;
  readonly strictParticipantMerging?: boolean;
}
