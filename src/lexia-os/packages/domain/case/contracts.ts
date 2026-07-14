import { Case } from './models.js';
import { Participant } from '../document/index.js';

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

export interface MergeReport {
  readonly merged: number;
  readonly created: number;
  readonly ignored: number;
  readonly conflicts: number;
  readonly durationMs: number;
}

export interface TimelineMergePolicy {
  readonly strategy: 'DATE_THEN_TIMESTAMP' | 'STRICT_TIMESTAMP';
  readonly tiebreaker: 'DOCUMENT_ID' | 'NONE';
}

export interface ParticipantMergeResult {
  readonly participants: Participant[];
  readonly report: MergeReport;
  readonly unresolvedConflicts: MergeConflict[];
}

export interface MergeConflict {
  readonly type: 'LOW_CONFIDENCE' | 'ROLE_MISMATCH' | 'MULTIPLE_CANDIDATES';
  readonly description: string;
  readonly incomingParticipantId: string;
  readonly existingParticipantId?: string;
}
