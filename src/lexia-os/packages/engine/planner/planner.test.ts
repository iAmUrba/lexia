import test from 'node:test';
import assert from 'node:assert';
import { CapabilityRoutingTable, RouteCondition } from './RoutingTable.js';
import { CapabilityPlanner } from './CapabilityPlanner.js';
import { CapabilityId } from '../types/index.js';

// Simulamos el Documento del dominio para que el engine no dependa del dominio
interface FakeState {
  assets: { type: string; [key: string]: any }[];
}

test('Capability Planner (State-based DAG Routing)', async (t) => {
  const table = new CapabilityRoutingTable();

  // Ruta 1: Si es PDF, planifica leer metadatos y leer texto
  table.addRoute({
    conditions: [{ assetType: 'MimeType', property: 'mimeType', value: 'application/pdf' }],
    targetCapabilities: [
      CapabilityId.of('reader.pdf.metadata.v1'),
      CapabilityId.of('reader.pdf.text.v1')
    ]
  });

  // Ruta 2: Si el estado de extracción dice que no hay texto disponible, planifica OCR
  table.addRoute({
    conditions: [{ assetType: 'ExtractionStatus', property: 'textAvailable', value: false }],
    targetCapabilities: [
      CapabilityId.of('ocr.image.tesseract.v1')
    ]
  });

  const evaluator = (state: FakeState, condition: RouteCondition): boolean => {
    return state.assets.some(asset => {
      if (asset.type !== condition.assetType) return false;
      if (condition.property && asset[condition.property] !== condition.value) return false;
      return true;
    });
  };

  const planner = new CapabilityPlanner<FakeState>(table, evaluator);

  await t.test('Planifica múltiples capacidades en paralelo si el estado hace match (PDF)', () => {
    const state: FakeState = {
      assets: [{ type: 'MimeType', mimeType: 'application/pdf' }]
    };

    const plan = planner.plan(state);
    
    assert.strictEqual(plan.nodes.length, 2);
    assert.ok(plan.nodes.find(n => n.capabilityId.value === 'reader.pdf.metadata.v1'));
    assert.ok(plan.nodes.find(n => n.capabilityId.value === 'reader.pdf.text.v1'));
  });

  await t.test('Si falla la extracción (estado muta), planifica OCR', () => {
    const state: FakeState = {
      assets: [
        { type: 'MimeType', mimeType: 'application/pdf' },
        { type: 'ExtractionStatus', textAvailable: false }
      ]
    };

    const plan = planner.plan(state);
    
    // Debería planificar reader.pdf.* Y ocr.image.*
    assert.strictEqual(plan.nodes.length, 3);
    assert.ok(plan.nodes.find(n => n.capabilityId.value === 'ocr.image.tesseract.v1'));
  });
});
