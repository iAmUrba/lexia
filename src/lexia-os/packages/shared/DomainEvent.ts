/**
 * Los eventos son hechos históricos. Nunca se modifican, nunca se reescriben y nunca se eliminan.
 */
export interface DomainEvent {
  eventId: string;
  type: string;
  aggregateId: string;
  aggregateVersion: number;
  occurredAt: Date;
  payload: Readonly<Record<string, unknown>>;
}

export class OptimisticConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OptimisticConcurrencyError";
  }
}
