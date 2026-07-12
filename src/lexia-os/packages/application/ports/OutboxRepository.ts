import { ID } from "../../shared/index.js";

export type OutboxMessage = {
  id: string;
  eventId: string;
  status: "PENDING" | "PUBLISHED";
  publishedAt: Date | null;
  attempts: number;
  lastError: string | null;
};

export interface OutboxRepository {
  findPending(limit: number): Promise<OutboxMessage[]>;
  markAsPublished(id: ID): Promise<void>;
  markAsFailed(id: ID, error: string): Promise<void>;
  getEventPayload(eventId: ID): Promise<any>;
}
