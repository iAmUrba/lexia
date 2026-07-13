import { ConfidenceScore, OperationId, CorrelationId } from '../../../foundation/contracts/index.js';
import { CapabilityId } from '../../../engine/types/index.js';

// ==========================================
// 1. Assets
// ==========================================

export interface AssetId {
  readonly value: string;
}

export type AssetType = 'PlainText' | 'Metadata' | 'OCR' | 'Classification' | 'Summary' | 'MimeType' | 'ExtractionStatus' | 'ExtractionQuality' | 'DocumentIndex';

export interface DocumentAsset {
  readonly assetId: AssetId;
  readonly assetType: AssetType;
  readonly version: number;
  readonly producer: CapabilityId;
  readonly producedAt: number;
  readonly confidence: ConfidenceScore;
}

export interface MimeTypeAsset extends DocumentAsset {
  readonly assetType: 'MimeType';
  readonly mimeType: string;
  readonly extension?: string;
}

export interface MetadataAsset extends DocumentAsset {
  readonly assetType: 'Metadata';
  readonly author?: string;
  readonly title?: string;
  readonly creationDate?: number;
  readonly isEncrypted: boolean;
}

// Ejemplos de Assets autocontenidos
export interface PlainTextAsset extends DocumentAsset {
  readonly assetType: 'PlainText';
  readonly text: string;
  readonly encoding: string;
  readonly language: string;
  readonly pageCount: number;
  readonly source: string;
}

export interface ExtractionStatusAsset extends DocumentAsset {
  readonly assetType: 'ExtractionStatus';
  readonly textAvailable: boolean;
  readonly reason?: string;
}

export type ExtractionMethod = 'NativeText' | 'OCR' | 'Hybrid';

export type WarningCode = 
  | 'LOW_TEXT' 
  | 'ENCRYPTED' 
  | 'CORRUPTED' 
  | 'EMPTY_DOCUMENT' 
  | 'IMAGE_ONLY' 
  | 'LOW_CONFIDENCE' 
  | 'UNSUPPORTED_FEATURE';

export interface ExtractionQualityAsset extends DocumentAsset {
  readonly assetType: 'ExtractionQuality';
  readonly method: ExtractionMethod;
  readonly extractedCharacters: number;
  readonly charactersPerPage: number;
  readonly emptyPages?: number;
  readonly warnings: WarningCode[];
  readonly requiresHumanReview: boolean;
}

// ==========================================
// Field Evidence & References (Index)
// ==========================================

export interface FieldEvidence {
  readonly extractor: string;
  readonly rule: string;
  readonly page?: number;
  readonly offset: number;
  readonly length: number;
  readonly confidence: ConfidenceScore;
}

export interface IdentifierReference {
  readonly value: string;
  readonly type: 'RADICADO' | 'PROCESO' | 'UNKNOWN';
  readonly evidence: FieldEvidence;
}

export type PersonRole = 'UNKNOWN' | 'JUEZ' | 'FISCAL' | 'DEFENSOR' | 'ACUSADO' | 'VÍCTIMA' | 'TESTIGO' | 'APODERADO' | 'SECRETARIO';

export interface PersonReference {
  readonly name: string;
  readonly role?: PersonRole;
  readonly evidence: FieldEvidence;
}

export interface DateReference {
  readonly dateIso: string;
  readonly originalText: string;
  readonly type?: string; // e.g. 'CREATION', 'HEARING'
  readonly evidence: FieldEvidence;
}

export interface LocationReference {
  readonly name: string;
  readonly evidence: FieldEvidence;
}

export interface CitationReference {
  readonly text: string;
  readonly evidence: FieldEvidence;
}

export interface DocumentTypeReference {
  readonly value: string;
  readonly evidence: FieldEvidence;
}

export interface DocumentIndexAsset extends DocumentAsset {
  readonly assetType: 'DocumentIndex';
  readonly primaryIdentifier?: IdentifierReference;
  readonly documentType?: DocumentTypeReference;
  readonly identifiers: IdentifierReference[];
  readonly people: PersonReference[];
  readonly dates: DateReference[];
  readonly locations: LocationReference[];
  readonly citations: CitationReference[];
}

// ==========================================
// 2. Timeline
// ==========================================

export interface TimelineOperation {
  readonly operation: string;
  readonly timestamp: number;
  readonly actor: string; // Puede ser un CapabilityId u otro actor
}

export interface DocumentTimeline {
  readonly operations: TimelineOperation[];
}

// ==========================================
// 3. Document
// ==========================================

export interface DocumentIdentity {
  readonly id: string;
}

export interface DocumentProvenance {
  readonly fingerprint: string;
  readonly origin: string;
  readonly receivedAt: number;
}

export interface DocumentAssetCollection {
  readonly items: ReadonlyArray<DocumentAsset>;
  latest<T extends DocumentAsset>(type: AssetType): T | undefined;
  all<T extends DocumentAsset>(type: AssetType): T[];
  has(type: AssetType): boolean;
  find<T extends DocumentAsset>(predicate: (asset: DocumentAsset) => boolean): T | undefined;
}

export type DocumentCapabilityNeed = 'NEEDS_TEXT' | 'NEEDS_OCR' | 'NEEDS_INDEX';

export interface DocumentState {
  readonly missingCapabilities: DocumentCapabilityNeed[];
  readonly readyForClassification: boolean;
  readonly readyForDrafting: boolean;
  readonly warnings: WarningCode[];
}

export interface Document {
  readonly identity: DocumentIdentity;
  readonly provenance: DocumentProvenance;
  readonly assets: DocumentAssetCollection;
  readonly timeline: DocumentTimeline;
  readonly executions: CapabilityExecution[];
}

// ==========================================
// 4. Execution & Provenance
// ==========================================

export interface CapabilityExecution {
  readonly id: string; // usually correlationId or operationId stringified
  readonly capability: string; // capabilityId
  readonly startedAt: number;
  readonly finishedAt: number;
  readonly inputs: AssetId[];
  readonly outputs: AssetId[];
  readonly warnings: string[];
  readonly executionTimeMs: number;
  readonly version: string;
}

// ==========================================
// 5. Snapshot
// ==========================================

export interface DocumentSnapshot {
  readonly producer: CapabilityId;
  readonly operationId: OperationId;
  readonly correlationId: CorrelationId;
  readonly assets: ReadonlyArray<DocumentAsset>;
  readonly durationMs: number;
  readonly startedAt?: number;
  readonly finishedAt?: number;
  readonly confidence?: ConfidenceScore;
  readonly warnings?: string[];
}
