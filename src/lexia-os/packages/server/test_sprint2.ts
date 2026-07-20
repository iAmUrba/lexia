import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EvidenceExtractor } from '../domain/glosador/EvidenceSystem/EvidenceExtractor.js';
import { EvidenceResolver, ResolveStatus } from '../domain/glosador/EvidenceSystem/EvidenceResolver.js';
import { db } from './db/index.js';
import { expedientes } from './db/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSprint2Test() {
  console.log('--- LEXIA CORE: SPRINT 2 TEST (REPRODUCIBILIDAD Y AUDITORÍA) ---');
  const startedAt = new Date().toISOString();
  const documentId = 'test-doc-123';
  const engineVersion = 'EvidenceResolver v1.0.0 (Rules 2026-07-16)';

  // 1. Simular Documento desde testdata (En Nivel 1 MVP será texto extraído)
  const jsonPath = path.join(__dirname, 'testdata', 'captura.json');
  const testData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Simulamos que el texto crudo tiene estos datos
  const mockText = `Informe de Captura\nRadicado: ${testData.radicado}\nProcesado: ${testData.procesado}\nSPOA: ${testData.spoa}\nTipo: ${testData.tipo}`;
  
  // 2. Extraer Evidencias
  const extractor = new EvidenceExtractor();
  const evidence = extractor.extract(mockText);
  
  // 3. Resolver Expediente
  const resolver = new EvidenceResolver();
  const result = await resolver.resolve(evidence);
  
  const finishedAt = new Date().toISOString();

  // 4. Construir Reporte de Auditoría
  const auditReport = {
      documentId,
      engineVersion,
      startedAt,
      finishedAt,
      extractorEvidence: evidence,
      resolverResult: {
          estado: result.estado,
          expedienteId: result.expedienteId,
          rutaExpediente: result.rutaExpediente,
          rutaConocimiento: result.rutaConocimiento
      },
      reasoning: result.cadenaDeEvidencias,
      telemetry: result.telemetria
  };

  console.log('\n--- INVESTIGATION REPORT ---');
  console.log(JSON.stringify(auditReport, null, 2));
  console.log('-----------------------------\n');
}

runSprint2Test();
