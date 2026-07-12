export class ID {
  constructor(public readonly value: string) {}

  static generate(): ID {
    return new ID(crypto.randomUUID());
  }

  equals(other: ID): boolean {
    return this.value === other.value;
  }
}

export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type { DomainEvent } from "./DomainEvent.js";
export { OptimisticConcurrencyError } from "./DomainEvent.js";
export * from "./bdd.js";
