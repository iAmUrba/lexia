import { ExpedienteCandidate } from './Scoring/EvidenceScorer.js';
import { ExtractedEvidence } from './EvidenceExtractor.js';
// En la versión final real importaríamos db y graphClient aquí
// import { db } from '../../../server/db/index.js';

import { IFileSystem } from '../ExecutionSystem/Contracts/IFileSystem.js';

export interface RepositoryTelemetry {
    sqliteTimeMs: number;
    graphTimeMs: number;
}

export class ExpedienteRepository {
    private mockDb: Map<string, ExpedienteCandidate> = new Map();
    private mockGraph: Map<string, ExpedienteCandidate> = new Map();
    private fileSystem?: IFileSystem;
    
    constructor(fileSystem?: IFileSystem) {
        this.fileSystem = fileSystem;
    }
    
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
        if (candidates.size === 0 && (evidence.radicados.length > 0 || evidence.spoa.length > 0 || evidence.procesados.length > 0)) {
            const graphStart = performance.now();
            
            if (this.mockState.graphDown) {
                error = 'GRAPH_UNAVAILABLE';
            } else if (this.fileSystem && this.fileSystem.search) {
                // Real Graph API Search
                // Construimos la consulta buscando radicados o nombres
                const searchTerms: string[] = [];
                for (const rad of evidence.radicados) searchTerms.push(rad.valor);
                for (const sp of evidence.spoa) searchTerms.push(sp.valor);
                for (const proc of evidence.procesados) searchTerms.push(proc.valor);
                
                if (searchTerms.length > 0) {
                    const query = searchTerms.join(' OR ');
                    try {
                        const results = await this.fileSystem.search(query);
                        // Los resultados en Graph traen name, id, parentReference.path
                        for (const item of results) {
                            if (item.folder) {
                                // Es una carpeta, la agregamos como candidato
                                const fullPath = (item.parentReference?.path ? item.parentReference.path.replace('/drive/root:', '') : '') + '/' + item.name;
                                candidates.set(item.id, {
                                    id: item.id,
                                    path: fullPath,
                                    radicados: [],
                                    spoa: [],
                                    cui: [],
                                    procesados: []
                                });
                            }
                        }
                    } catch (e: any) {
                        error = e.message;
                    }
                }
            } else {
                // Simulación de búsqueda en Graph API por radicado (MOCK)
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
