import { DomainEvent } from "../../shared/index.js";
import { EventStore } from "../../application/ports/EventStore.js";
import { domainEvents, outbox } from "./schema.js";

type DrizzleClient = any;

export class DrizzleEventStoreAdapter implements EventStore {
  constructor(private db: DrizzleClient) {}

  async append(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      // 1. Guardar en tabla de DomainEvent (Event Store)
      await this.db.insert(domainEvents).values({
        eventId: event.eventId,
        type: event.type,
        aggregateId: event.aggregateId,
        aggregateVersion: event.aggregateVersion,
        occurredAt: event.occurredAt,
        payload: event.payload
      });

      // 2. Insertar inmediatamente en la tabla Outbox para garantizar Publicación 
      //    (Transactional Outbox Pattern)
      await this.db.insert(outbox).values({
        id: event.eventId, // Usamos el mismo ID de evento para el registro del outbox
        eventId: event.eventId,
        status: "PENDING",
        attempts: 0
      });
    }
  }
}
