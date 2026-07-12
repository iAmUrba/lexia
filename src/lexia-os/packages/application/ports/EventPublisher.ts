import { DomainEvent } from "../../shared/index.js";

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}
