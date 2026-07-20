import { ExpedienteCandidate } from './Scoring/EvidenceScorer.js';
import { ExtractedEvidence } from './EvidenceExtractor.js';
// En la versión final real importaríamos db y graphClient aquí
// import { db } from '../../../server/db/index.js';

export interface RepositoryTelemetry {
    sqliteTimeMs: number;
    graphTimeMs: number;
}

export class ExpedienteRepository {
    private mockDb: Map<string, ExpedienteCandidate> = new Map();
    private mockGraph: Map<string, ExpedienteCandidate> = new Map();
    
    // Solo para pruebas del Sprint 2
    public injectMockData(sqliteData: ExpedienteCandidate[], graphData: ExpedienteCandidate[]) {
        sqliteData.forEach(c => this.mockDb.set(c.id, c));
        graphData.forEach(c => this.mockGraph.set(c.id, c));
    }

    private mockState: { graphDown?: boolean, sqliteCorrupt?: boolean, timeout?: boolean } = {};

    public injectMockState(state: { graphDown?: boolean, sqliteCorrupt?: boolean, timeout?: boolean }) {
        this.mockState = state;
    }
    /**
     * Encapsula la lógica de buscar primero en SQLite y luego en Graph API si es necesario.
     */
    public async findCandidates(evidence: ExtractedEvidence): Promise<{ candidates: ExpedienteCandidate[], telemetry: RepositoryTelemetry }> {
        const candidates = new Map<string, ExpedienteCandidate>();
        let sqliteTimeMs = 0;
        let graphTimeMs = 0;
        let error: string | undefined = undefined;

        if (this.mockState.timeout) {
            return {
                candidates: [],
                telemetry: { sqliteTimeMs: 0, graphTimeMs: 10000, error: 'TIMEOUT' }
            };
        }

        const sqliteStart = performance.now();
        
        let skipSqlite = false;
        if (this.mockState.sqliteCorrupt) {
            skipSqlite = true;
            // Simulated error handling, skip DB
        }

        if (!skipSqlite) {
            // Buscamos por cada radicado
            for (const rad of evidence.radicados) {
                for (const [id, exp] of this.mockDb.entries()) {
                    if (exp.radicados.includes(rad.valor)) {
                        candidates.set(id, exp);
                    }
                }
            }
            
            // Buscamos por SPOA
            for (const s of evidence.spoa) {
                for (const [id, exp] of this.mockDb.entries()) {
                    if (exp.spoa.includes(s.valor)) {
                        candidates.set(id, exp);
                    }
                }
            }
            
            // Buscamos por CUI
             for (const c of evidence.cui) {
                for (const [id, exp] of this.mockDb.entries()) {
                    if (exp.cui.includes(c.valor)) {
                        candidates.set(id, exp);
                    }
                }
            }
            
            // Buscamos por Procesados (si no hay nada fuerte)
            if (candidates.size === 0) {
                for (const p of evidence.procesados) {
                    for (const [id, exp] of this.mockDb.entries()) {
                        if (exp.procesados.some(ep => ep.toLowerCase().includes(p.valor.toLowerCase()) || p.valor.toLowerCase().includes(ep.toLowerCase()))) {
                            candidates.set(id, exp);
                        }
                    }
                }
            }
        }
        sqliteTimeMs = performance.now() - sqliteStart;

        // 2. Fallback a Graph API si no encontramos nada contundente en SQLite (ej. ningún candidato)
        if (candidates.size === 0 && evidence.radicados.length > 0) {
            const graphStart = performance.now();
            
            if (this.mockState.graphDown) {
                error = 'GRAPH_UNAVAILABLE';
            } else {
                // Simulación de búsqueda en Graph API por radicado
                for (const rad of evidence.radicados) {
                    for (const [id, exp] of this.mockGraph.entries()) {
                        if (exp.radicados.includes(rad.valor)) {
                            candidates.set(id, exp);
                        }
                    }
                }
            }
            
            graphTimeMs = performance.now() - graphStart;
        }

        return {
            candidates: Array.from(candidates.values()),
            telemetry: {
                sqliteTimeMs: Math.round(sqliteTimeMs),
                graphTimeMs: Math.round(graphTimeMs),
                error
            }
        };
    }
}
