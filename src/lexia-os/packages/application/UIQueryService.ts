import { InMemoryWorkRepositoryAdapter } from "../infrastructure/inmemory/InMemoryWorkRepositoryAdapter.js";
import { InMemoryDocumentRepositoryAdapter } from "../infrastructure/inmemory/InMemoryDocumentRepositoryAdapter.js";
import { InMemoryEventStoreAdapter } from "../infrastructure/inmemory/InMemoryEventStoreAdapter.js";

// Read Model Service simple para la UI (CQRS)
export class UIQueryService {
  constructor(
    private workRepo: InMemoryWorkRepositoryAdapter,
    private docRepo: InMemoryDocumentRepositoryAdapter,
    private eventStore: InMemoryEventStoreAdapter
  ) {}

  async listExpedientes(rol?: string, despacho_id?: string) {
    let works = Array.from(this.workRepo.map.values());
    
    // Filtro de multi-tenant
    if (rol !== 'admin' && despacho_id) {
      works = works.filter(w => (w as any).despacho_id === despacho_id);
    }
    
    return works.map(w => ({
      id: w.id.value,
      description: w.description,
      state: w.state,
      createdAt: w.createdAt,
      metadata: w.metadata,
      despacho_id: (w as any).despacho_id
    }));
  }

  async getExpediente(id: string, rol?: string, despacho_id?: string) {
    const works = Array.from(this.workRepo.map.values());
    const work = works.find(w => w.id.value === id);
    if (!work) return null;

    // Aislamiento multi-tenant
    if (rol !== 'admin' && (work as any).despacho_id !== despacho_id) {
      return null;
    }

    const docs = Array.from(this.docRepo.map.values()).filter(d => d.workId.value === id);

    const relatedEvents = this.eventStore.storedEvents.filter(e => 
      e.aggregateId === id || 
      docs.some(d => e.aggregateId === d.id.value) || 
      e.aggregateId === work.eventId.value
    );

    return {
      work: {
        id: work.id.value,
        description: work.description,
        state: work.state,
        createdAt: work.createdAt,
        metadata: work.metadata
      },
      documents: docs.map(d => ({
        id: d.id.value,
        title: d.title,
        state: d.state,
        content: d.content,
        createdAt: d.createdAt
      })),
      events: relatedEvents.map(e => ({
        eventId: e.eventId,
        type: e.type,
        occurredAt: e.occurredAt,
        payload: e.payload
      }))
    };
  }
}
