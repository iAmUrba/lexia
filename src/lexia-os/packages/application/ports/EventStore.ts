import { DomainEvent } from "../../shared/index.js";

export interface EventStore {
  append(events: DomainEvent[]): Promise<void>;
}
