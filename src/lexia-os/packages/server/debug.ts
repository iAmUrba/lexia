import { EvidenceExtractor } from '../domain/glosador/EvidenceSystem/EvidenceExtractor.js';
import { EvidenceResolver } from '../domain/glosador/EvidenceSystem/EvidenceResolver.js';
import { ExpedienteRepository } from '../domain/glosador/EvidenceSystem/ExpedienteRepository.js';
import { EvidenceScorer } from '../domain/glosador/EvidenceSystem/Scoring/EvidenceScorer.js';

const extractor = new EvidenceExtractor();
const evidence = extractor.extract('Radicado: 111111111111111111111');
console.log("EVIDENCE:", JSON.stringify(evidence, null, 2));

const repo = new ExpedienteRepository();
repo.injectMockData([{ id: 'EXP_A', radicados: ['111111111111111111111'], spoa: [], cui: [], procesados: [] }], []);

const scorer = new EvidenceScorer();
const resolver = new EvidenceResolver(repo, scorer);
resolver.resolve(evidence).then(res => console.log("RESULT:", JSON.stringify(res, null, 2)));
