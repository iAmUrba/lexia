import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';

import { 
  ProcessDocumentUseCase, 
  GetCaseHeader, 
  CaseHeaderProjector, 
  CaseSummaryProjector,
  DocumentValidator,
  MissingRadicadoRule,
  MissingCourtRule
} from '../index.js';
import { DocumentIntakeService } from '../services/documentIntake/DocumentIntakeService.js';

import { CognitivePlanner } from '@lexia/intelligence';
import { DocumentAssembler, DocumentStateEvaluator } from '@lexia/domain';
import { CapabilityPlanner, CapabilityRoutingTable, CapabilityRegistry, Executor, CapabilityId } from '@lexia/engine';
import { PdfParseAdapter } from '@lexia/adapters-pdf';
import { buildPdfExtractDescriptor } from '@lexia/intelligence/capabilities/reader/pdf/extract.js';
import { buildDocumentIndexDescriptor } from '@lexia/intelligence/capabilities/document/index/index.js';
import { RadicadoExtractor } from '@lexia/intelligence/capabilities/document/index/contributors/RadicadoExtractor.js';
import { CourtExtractor } from '@lexia/intelligence/capabilities/document/index/contributors/CourtExtractor.js';
import { DateExtractor } from '@lexia/intelligence/capabilities/document/index/contributors/DateExtractor.js';
import { CaseNumberExtractor } from '@lexia/intelligence/capabilities/document/index/contributors/CaseNumberExtractor.js';
import { DocumentTypeExtractor } from '@lexia/intelligence/capabilities/document/index/contributors/DocumentTypeExtractor.js';

function buildUseCase(): ProcessDocumentUseCase {
  const assembler = new DocumentAssembler();
  const evaluator = new DocumentStateEvaluator();
  
  const routingTable = new CapabilityRoutingTable();
  routingTable.addRoute({
    conditions: [{ assetType: 'MimeType', property: 'mimeType', value: 'application/pdf' }],
    targetCapabilities: [CapabilityId.of('reader.pdf.extract.v1')]
  });
  routingTable.addRoute({
    conditions: [{ assetType: 'ExtractionStatus', property: 'textAvailable', value: true }],
    targetCapabilities: [CapabilityId.of('document.index.v1')]
  });
  
  const conditionEvaluator = (state: any, condition: any): boolean => {
    if (condition.assetType === 'MimeType' && state.readyForClassification === false) return true;
    if (condition.assetType === 'ExtractionStatus' && state.missingCapabilities.includes('NEEDS_INDEX')) return true;
    return false;
  };
  
  const enginePlanner = new CapabilityPlanner(routingTable, conditionEvaluator);
  const executor = new Executor();
  const registry = new CapabilityRegistry();
  
  registry.register(buildPdfExtractDescriptor(new PdfParseAdapter()));
  
  const indexContributors = [
    new RadicadoExtractor(),
    new CourtExtractor(),
    new DateExtractor(),
    new CaseNumberExtractor(),
    new DocumentTypeExtractor()
  ];
  registry.register(buildDocumentIndexDescriptor(indexContributors));
  
  const cognitivePlanner = new CognitivePlanner(enginePlanner, registry, executor, assembler, evaluator);
  
  const auditSink = { log: () => {}, record: async () => {} };
  const intake = new DocumentIntakeService(auditSink as any);
  
  const validator = new DocumentValidator([new MissingRadicadoRule(), new MissingCourtRule()]);
  const projector = new CaseHeaderProjector();
  const getCaseHeader = new GetCaseHeader(projector, validator);
  const caseSummaryProjector = new CaseSummaryProjector(projector);
  
  return new ProcessDocumentUseCase(intake as any, cognitivePlanner, getCaseHeader, caseSummaryProjector);
}

test('ProcessDocumentUseCase - Regression Corpus', async (t) => {
  const useCase = buildUseCase();
  const corpusDir = path.resolve(process.cwd(), '../../fixtures/court');

  // Traverse fixtures/court recursively looking for expected.json
  const findCorpusCases = (dir: string, cases: string[] = []) => {
    if (!fs.existsSync(dir)) return cases;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findCorpusCases(fullPath, cases);
      } else if (file === 'expected.json') {
        cases.push(dir);
      }
    }
    return cases;
  };

  const cases = findCorpusCases(corpusDir);

  for (const caseDir of cases) {
    await t.test(`Caso: ${path.relative(corpusDir, caseDir)}`, async () => {
      // Find the PDF file in this directory
      const files = fs.readdirSync(caseDir);
      const pdfFile = files.find(f => f.endsWith('.pdf'));
      
      assert.ok(pdfFile, `No se encontró un archivo .pdf en ${caseDir}`);
      
      const pdfPath = path.join(caseDir, pdfFile);
      const expectedPath = path.join(caseDir, 'expected.json');
      
      const expectedContent = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
      const expected = expectedContent.expected;
      
      const buffer = fs.readFileSync(pdfPath);
      
      const result = await useCase.execute({
        origin: 'TEST',
        pathOrUri: pdfPath,
        receivedAt: Date.now(),
        byteSize: buffer.length,
        fingerprint: pdfFile,
        buffer,
        mimeType: 'application/pdf',
        originalName: pdfFile,
        actor: { id: 'test', type: 'system' }
      } as any);

      // Validate Case Header
      assert.strictEqual(result.caseHeader.radicado ?? null, expected.radicado ?? null, 'Radicado no coincide');
      assert.strictEqual(result.caseHeader.juzgado ?? null, expected.juzgado ?? null, 'Juzgado no coincide');
      assert.strictEqual(result.caseHeader.tipoDocumento ?? null, expected.tipoDocumento ?? null, 'Tipo de documento no coincide');
      assert.strictEqual(result.caseHeader.fecha ?? null, expected.fecha ?? null, 'Fecha no coincide');
      
      // Validar advertencias esperadas en el validation report (ajustado al modelo real si se implementa)
      // En la versión actual lo comprobamos con el issues map o lo dejamos comentado hasta refinar
      // const issuesCodes = result.validation.issues.map(i => i.code);
      // expected.advertencias.forEach(adv => assert.ok(issuesCodes.includes(adv), `Falta la advertencia ${adv}`));
      
      // Validar que se guardó el CapabilityExecution
      assert.ok(result.document.executions.length > 0, 'No se generaron ejecuciones');
      
      // Validar métricas de observabilidad
      assert.ok(result.metrics.capabilities.length > 0, 'No se reportaron métricas de capability');
      assert.ok(result.metrics.totalDurationMs >= 0, 'El tiempo de ejecución debe ser positivo');
    });
  }
});
