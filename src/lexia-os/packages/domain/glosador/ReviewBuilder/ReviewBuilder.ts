import { AnalysisResult } from '../PdfAnalyzer/PdfAnalyzer.js';
import { ExpedienteSearchResult } from '../ExpedienteFinder/ExpedienteFinder.js';
import { ConsecutiveResult } from '../ConsecutiveCalculator/ConsecutiveCalculator.js';

export interface DocumentReview {
  fileName: string;
  analysis: any; // Fallback
  expedienteSearchResult: ExpedienteSearchResult | null;
  consecutiveResult: ConsecutiveResult | null;
  status: 'READY' | 'MANUAL_REVIEW' | 'NOT_FOUND' | 'ADMINISTRATIVE';
  actionMessage: string;
  explanation: string[];
}

export class ReviewBuilder {
  buildReview(
    fileName: string, 
    analysis: any, 
    expedienteSearchResult: ExpedienteSearchResult | null, 
    consecutiveResult: ConsecutiveResult | null,
    explanation?: string[]
  ): DocumentReview {
    
    // We delegate the final status and message to the caller now
    return {
      fileName,
      analysis,
      expedienteSearchResult,
      consecutiveResult,
      status: 'NOT_FOUND',
      actionMessage: '',
      explanation: explanation || []
    };
  }
}
