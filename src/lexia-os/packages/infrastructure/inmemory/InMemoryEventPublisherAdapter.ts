import { DomainEvent } from "../../shared/index.js";
import { EventPublisher } from "../../application/ports/EventPublisher.js";

export class InMemoryEventPublisherAdapter implements EventPublisher {
  public publishedEvents: DomainEvent[] = [];
  private subscribers: Map<string, Array<(event: DomainEvent) => void>> = new Map();

  subscribe(eventType: string, handler: (event: DomainEvent) => void) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(handler);
  }

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
    
    // Notificar asíncronamente
    const handlers = this.subscribers.get(event.type) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
