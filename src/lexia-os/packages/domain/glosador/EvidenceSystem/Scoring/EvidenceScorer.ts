import { ExtractedEvidence, EvidenceItem } from '../EvidenceExtractor.js';
import { EvidenceWeights, Thresholds } from './EvidenceWeights.js';
import { EvidenceChainStep } from '../EvidenceResolver.js';

export interface ExpedienteCandidate {
    id: string; // Radicado u otro identificador primario
    driveId?: string | null;
    folderId?: string | null;
    path?: string | null;
    
    // Metadatos conocidos (en BD o Graph)
    radicados: string[];
    spoa: string[];
    cui: string[];
    procesados: string[];
    // ... otros metadatos
}

export interface ScoreResult {
    candidateId: string;
    totalScore: number;
    chain: EvidenceChainStep[];
}

export class EvidenceScorer {
    
    public score(evidence: ExtractedEvidence, candidate: ExpedienteCandidate): ScoreResult {
        const chain: EvidenceChainStep[] = [];
        let totalScore = 0;

        // 1. Radicado
        if (evidence.radicados.length > 0) {
            const hasMatch = evidence.radicados.some(r => candidate.radicados.includes(r.valor));
            if (hasMatch) {
                totalScore += EvidenceWeights.RADICADO;
                chain.push({ tipo: 'RADICADO', valor: evidence.radicados[0].valor, peso: EvidenceWeights.RADICADO, resultado: 'MATCH' });
            } else if (candidate.radicados.length > 0) {
                chain.push({ tipo: 'RADICADO', valor: evidence.radicados[0].valor, peso: EvidenceWeights.RADICADO, resultado: 'CONFLICTO' });
                totalScore -= EvidenceWeights.RADICADO;
            } else {
                chain.push({ tipo: 'RADICADO', valor: evidence.radicados[0].valor, peso: EvidenceWeights.RADICADO, resultado: 'NO_MATCH' });
            }
        }

        // 2. SPOA
        if (evidence.spoa.length > 0) {
            const hasMatch = evidence.spoa.some(s => candidate.spoa.includes(s.valor));
            if (hasMatch) {
                totalScore += EvidenceWeights.SPOA;
                chain.push({ tipo: 'SPOA', valor: evidence.spoa[0].valor, peso: EvidenceWeights.SPOA, resultado: 'MATCH' });
            } else if (candidate.spoa.length > 0) {
                // Si el candidato tiene SPOA y no coincide, resta confianza (Conflicto fuerte)
                chain.push({ tipo: 'SPOA', valor: evidence.spoa[0].valor, peso: EvidenceWeights.SPOA, resultado: 'CONFLICTO' });
                totalScore -= EvidenceWeights.SPOA; 
            } else {
                chain.push({ tipo: 'SPOA', valor: evidence.spoa[0].valor, peso: EvidenceWeights.SPOA, resultado: 'NO_MATCH' });
            }
        }

        // 3. CUI
        if (evidence.cui.length > 0) {
            const hasMatch = evidence.cui.some(c => candidate.cui.includes(c.valor));
            if (hasMatch) {
                totalScore += EvidenceWeights.CUI;
                chain.push({ tipo: 'CUI', valor: evidence.cui[0].valor, peso: EvidenceWeights.CUI, resultado: 'MATCH' });
            } else {
                chain.push({ tipo: 'CUI', valor: evidence.cui[0].valor, peso: EvidenceWeights.CUI, resultado: 'NO_MATCH' });
            }
        }

        // 4. Procesados
        if (evidence.procesados.length > 0) {
            // Lógica simple de coincidencia de nombres para el MVP
            const hasMatch = evidence.procesados.some(p => 
                candidate.procesados.some(cp => cp.toLowerCase().includes(p.valor.toLowerCase()) || p.valor.toLowerCase().includes(cp.toLowerCase()))
            );
            if (hasMatch) {
                totalScore += EvidenceWeights.PROCESADO;
                chain.push({ tipo: 'PROCESADO', valor: evidence.procesados[0].valor, peso: EvidenceWeights.PROCESADO, resultado: 'MATCH' });
            } else {
                chain.push({ tipo: 'PROCESADO', valor: evidence.procesados[0].valor, peso: EvidenceWeights.PROCESADO, resultado: 'NO_MATCH' });
            }
        }

        return {
            candidateId: candidate.id,
            totalScore,
            chain
        };
    }
}
