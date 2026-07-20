import { ExtractedEvidence } from './EvidenceExtractor.js';
import { ExpedienteRepository } from './ExpedienteRepository.js';
import { EvidenceScorer, ExpedienteCandidate } from './Scoring/EvidenceScorer.js';
import { Thresholds } from './Scoring/EvidenceWeights.js';

export enum ResolveStatus {
  ENCONTRADO = 'ENCONTRADO',
  POSIBLE = 'POSIBLE',
  NO_ENCONTRADO = 'NO_ENCONTRADO'
}

export interface EvidenceChainStep {
  tipo: string;
  valor: string;
  peso: number;
  resultado: 'MATCH' | 'NO_MATCH' | 'CONFLICTO';
}

export enum ResolveReason {
  EVIDENCIA_CONFLICTIVA = 'EVIDENCIA_CONFLICTIVA',
  RADICADO_DUPLICADO = 'RADICADO_DUPLICADO',
  GRAPH_UNAVAILABLE = 'GRAPH_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  INSUFFICIENT_CONFIDENCE = 'INSUFFICIENT_CONFIDENCE',
  SQLITE_CORRUPT = 'SQLITE_CORRUPT',
  NONE = 'NONE'
}

export interface ResolveTelemetry {
    sqliteTimeMs: number;
    graphTimeMs: number;
    scoringTimeMs: number;
    totalTimeMs: number;
}

export interface InvestigationReport {
    documentId: string;
    engineVersion: string;
    startedAt: string;
    finishedAt: string;
    extractorEvidence: ExtractedEvidence;
    resolverResult: ResolveResult;
}

export interface ResolveResult {
  estado: ResolveStatus;
  reason?: ResolveReason;
  expedienteId: string | null;
  rutaExpediente: string | null;
  rutaConocimiento: string | null;
  cadenaDeEvidencias: EvidenceChainStep[];
  confianza: number;
  telemetry: ResolveTelemetry;
}

export class EvidenceResolver {
  private repository: ExpedienteRepository;
  private scorer: EvidenceScorer;

  constructor(repository: ExpedienteRepository, scorer: EvidenceScorer) {
      this.repository = repository;
      this.scorer = scorer;
  }

  /**
   * Orquesta la resolución del expediente buscando candidatos y puntuándolos.
   */
  public async resolve(evidence: ExtractedEvidence): Promise<ResolveResult> {
    const start = performance.now();
    
    // 1. Obtener candidatos del repositorio
    const { candidates, telemetry: repoTelemetry } = await this.repository.findCandidates(evidence);
    
    // 2. Puntuar candidatos
    const scoreStart = performance.now();
    const scoredCandidates = candidates.map(c => {
        return {
            candidate: c,
            score: this.scorer.score(evidence, c)
        };
    });
    
    // Ordenar de mayor a menor puntaje
    scoredCandidates.sort((a, b) => b.score.totalScore - a.score.totalScore);
    const scoringTimeMs = Math.round(performance.now() - scoreStart);

    let estado = ResolveStatus.NO_ENCONTRADO;
    let reason = ResolveReason.NONE;
    let bestCandidate: ExpedienteCandidate | null = null;
    let bestScoreObj = null;

    if (repoTelemetry.error === 'TIMEOUT') {
        estado = ResolveStatus.NO_ENCONTRADO;
        reason = ResolveReason.TIMEOUT;
        return this.buildResult(estado, reason, null, null, [], 0, start, scoreStart, repoTelemetry);
    }
    if (repoTelemetry.error === 'GRAPH_UNAVAILABLE') {
        estado = ResolveStatus.NO_ENCONTRADO;
        reason = ResolveReason.GRAPH_UNAVAILABLE;
        return this.buildResult(estado, reason, null, null, [], 0, start, scoreStart, repoTelemetry);
    }

    if (scoredCandidates.length > 0) {
        const top1 = scoredCandidates[0];
        
        if (top1.score.totalScore >= Thresholds.ENCONTRADO) {
            estado = ResolveStatus.ENCONTRADO;
            bestCandidate = top1.candidate;
            bestScoreObj = top1.score;

            if (scoredCandidates.length > 1) {
                const top2 = scoredCandidates[1];
                const diff = top1.score.totalScore - top2.score.totalScore;
                
                if (diff === 0 && top1.score.totalScore === top2.score.totalScore) {
                     estado = ResolveStatus.POSIBLE;
                     reason = ResolveReason.RADICADO_DUPLICADO;
                } else {
                     const hasExplicitConflict = top1.score.chain.some(s => s.resultado === 'CONFLICTO');
                     if (diff <= Thresholds.CONFLICTO_MARGEN || hasExplicitConflict) {
                         estado = ResolveStatus.POSIBLE;
                         reason = ResolveReason.EVIDENCIA_CONFLICTIVA;
                     }
                }
            } else {
                 const hasExplicitConflict = top1.score.chain.some(s => s.resultado === 'CONFLICTO');
                 if (hasExplicitConflict) {
                     estado = ResolveStatus.POSIBLE;
                     reason = ResolveReason.EVIDENCIA_CONFLICTIVA;
                 }
            }
        } else {
            estado = ResolveStatus.POSIBLE;
            reason = ResolveReason.INSUFFICIENT_CONFIDENCE;
            
            const hasExplicitConflict = top1.score.chain.some(s => s.resultado === 'CONFLICTO');
            if (hasExplicitConflict) {
                reason = ResolveReason.EVIDENCIA_CONFLICTIVA;
            }
            
            bestCandidate = top1.candidate;
            bestScoreObj = top1.score;
        }
    }

    return this.buildResult(
        estado, 
        reason, 
        bestCandidate ? bestCandidate.id : null, 
        bestCandidate?.path || null, 
        bestScoreObj ? bestScoreObj.chain : [], 
        bestScoreObj ? bestScoreObj.totalScore : 0, 
        start, 
        scoreStart, 
        repoTelemetry
    );
  }

  private buildResult(estado: ResolveStatus, reason: ResolveReason, expedienteId: string | null, rutaExpediente: string | null, cadenaDeEvidencias: EvidenceChainStep[], confianza: number, start: number, scoreStart: number, repoTelemetry: any): ResolveResult {
      const scoringTimeMs = Math.round(performance.now() - scoreStart);
      const totalTimeMs = Math.round(performance.now() - start);
      return {
          estado,
          reason,
          expedienteId,
          rutaExpediente,
          rutaConocimiento: this.inferConocimientoPath(rutaExpediente),
          cadenaDeEvidencias,
          confianza,
          telemetry: {
              ...repoTelemetry,
              scoringTimeMs,
              totalTimeMs
          }
      };
  }

  private inferConocimientoPath(basePath: string | null): string | null {
    if (!basePath) return null;
    return `${basePath}/CONOCIMIENTO`;
  }
}
