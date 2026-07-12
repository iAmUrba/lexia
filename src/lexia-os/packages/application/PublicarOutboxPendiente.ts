import { EventPublisher } from "./ports/EventPublisher.js";
import { OutboxRepository } from "./ports/OutboxRepository.js";
import { ID } from "../shared/index.js";

export class PublicarOutboxPendiente {
  constructor(
    private outboxRepo: OutboxRepository,
    private publisher: EventPublisher
  ) {}

  async execute(limit: number = 10): Promise<void> {
    const pendings = await this.outboxRepo.findPending(limit);
    
    for (const msg of pendings) {
      try {
        // En un sistema real, el EventStore o un Repositorio específico nos daría el payload.
        // Aquí lo recuperamos a través del OutboxRepository por conveniencia para publicar.
        const eventData = await this.outboxRepo.getEventPayload(new ID(msg.eventId));
        
        await this.publisher.publish(eventData);
        
        await this.outboxRepo.markAsPublished(new ID(msg.id));
      } catch (error: any) {
        await this.outboxRepo.markAsFailed(new ID(msg.id), error.message);
      }
    }
  }
}
