import test from 'node:test';
import assert from 'node:assert';
import { 
  CapabilityId, 
  CapabilityRegistry, 
  Executor, 
  Scheduler,
  CapabilityDescriptor,
  CapabilityInstance,
  CapabilityContext
} from './index.js';
import { FakeClock, FakeEventBus, FakeAuditSink } from '../foundation/testing/index.js';

class DummyCapability implements CapabilityInstance<string, string> {
  async execute(input: string, context: CapabilityContext): Promise<string> {
    // Si el texto es "lento", simulamos un delay para forzar timeout
    if (input === 'lento') {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return `dummy:${input}`;
  }
}

const dummyDescriptor: CapabilityDescriptor<string, string> = {
  id: CapabilityId.of('dummy.test.v1'),
  version: '1.0.0',
  requirements: ['LocalLLM'],
  profile: {
    estimatedMemoryMB: 10,
    estimatedLatencyMs: 5,
    estimatedCpuUsage: 'Low',
    parallelizable: true,
    suggestedPriority: 'Normal'
  },
  preconditions: (input) => {
    if (!input) return { valid: false, reason: 'Empty input' };
    return { valid: true };
  },
  postconditions: (output) => {
    if (!output.startsWith('dummy:')) return { valid: false, reason: 'Invalid prefix' };
    return { valid: true };
  },
  createInstance: async () => new DummyCapability()
};

test('Execution Engine (Capability Engine)', async (t) => {
  t.beforeEach(() => { FakeClock.freeze(1000); });
  t.afterEach(() => { FakeClock.unfreeze(); });

  const registry = new CapabilityRegistry();
  registry.register(dummyDescriptor);
  
  const executor = new Executor();
  const scheduler = new Scheduler(registry, executor);

  const buildContext = (opId: string): CapabilityContext => ({
    abortSignal: new AbortController().signal,
    correlationId: { value: 'corr-1' },
    operationId: { value: opId },
    clock: FakeClock,
    logger: { info: () => {}, error: () => {} },
    audit: new FakeAuditSink(),
    events: new FakeEventBus(),
    config: { get: () => null },
    metrics: { record: () => {} },
    trace: { startSpan: () => {}, endSpan: () => {} }
  });

  await t.test('Registry guarda y recupera descriptores', () => {
    const list = registry.listCapabilities();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].value, 'dummy.test.v1');
    
    const byReq = registry.findByRequirement('LocalLLM');
    assert.strictEqual(byReq.length, 1);
  });

  await t.test('Scheduler ejecuta exitosamente una capacidad respetando el entorno', async () => {
    const res = await scheduler.dispatch('dummy.test.v1', 'hola', buildContext);
    
    assert.strictEqual(res.result.ok, true);
    if (res.result.ok) {
      assert.strictEqual(res.result.value, 'dummy:hola');
    }
  });

  await t.test('Preconditions bloquean ejecución incorrecta', async () => {
    const res = await scheduler.dispatch('dummy.test.v1', '', buildContext);
    
    assert.strictEqual(res.result.ok, false);
    if (!res.result.ok) {
      assert.match((res.result.error as Error).message, /Precondición fallida/);
    }
  });

  await t.test('Timeout aborta la ejecución correctamente', async () => {
    // Le pasamos 'lento' que tarda 500ms, pero el timeout es 10ms
    const res = await scheduler.dispatch('dummy.test.v1', 'lento', buildContext, { timeoutMs: 10 });
    
    assert.strictEqual(res.result.ok, false);
    if (!res.result.ok) {
      assert.match((res.result.error as Error).message, /TIMEOUT/);
    }
  });
});
