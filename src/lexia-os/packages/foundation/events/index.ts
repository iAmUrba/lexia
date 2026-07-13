import { Id } from '../id/index.js';
import { Clock } from '../clock/index.js';
import { DomainEvent } from '../contracts/index.js';

export type EventHandler = (event: DomainEvent) => Promise<void> | void;

export class EventBus {
  private static handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Publica un evento de dominio en el bus.
   */
  static async publish(eventName: string, payload: Record<string, any>, version: string = '1'): Promise<void> {
    const event: DomainEvent = Object.freeze({
      id: Id.generate(),
      name: eventName,
      occurredAt: Clock.timestamp(),
      version,
      payload
    });

    const eventHandlers = this.handlers.get(eventName) || [];
    const allHandlers = this.handlers.get('*') || [];

    const promises = [...eventHandlers, ...allHandlers].map(handler => handler(event));
    await Promise.allSettled(promises);
  }

  /**
   * Suscribe un manejador a un evento específico (o '*' para todos).
   */
  static subscribe(eventName: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventName) || [];
    this.handlers.set(eventName, [...existing, handler]);
  }
}
