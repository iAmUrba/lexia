export interface CaseHeaderView {
  readonly id: string;
  readonly radicado?: string;
  readonly juzgado?: string;
  readonly tipoDocumento?: string;
  readonly fecha?: string;
  readonly method: 'NativeText' | 'OCR' | 'Hybrid' | 'Unknown';
  readonly requiresHumanReview: boolean;
  readonly estado: 'READY' | 'NEEDS_OCR' | 'PROCESSING';
}
