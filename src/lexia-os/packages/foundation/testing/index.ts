import { AuditSink, AuditRecord, DomainEvent } from '../contracts/index.js';

export class FakeClock {
  private static frozenTime: number | null = null;

  static freeze(time: number = 1000000000) {
    this.frozenTime = time;
  }

  static unfreeze() {
    this.frozenTime = null;
  }

  static timestamp(): number {
    return this.frozenTime ?? Date.now();
  }
}

export class FakeAuditSink implements AuditSink {
  public records: AuditRecord[] = [];

  async record(audit: AuditRecord): Promise<void> {
    this.records.push(audit);
  }

  clear() {
    this.records = [];
  }
}

export type EventHandler = (event: DomainEvent) => Promise<void> | void;

export class FakeEventBus {
  public publishedEvents: DomainEvent[] = [];
  private handlers: Map<string, EventHandler[]> = new Map();

  async publish(eventName: string, payload: Record<string, any>, version: string = '1'): Promise<void> {
    const event: DomainEvent = Object.freeze({
      id: 'fake-id',
      name: eventName,
      occurredAt: FakeClock.timestamp(),
      version,
      payload
    });

    this.publishedEvents.push(event);

    const eventHandlers = this.handlers.get(eventName) || [];
    const allHandlers = this.handlers.get('*') || [];

    // Simulate isolation: errors don't crash other handlers
    const promises = [...eventHandlers, ...allHandlers].map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        // Ignorado por diseño en el EventBus de test
      }
    });

    await Promise.all(promises);
  }

  subscribe(eventName: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventName) || [];
    this.handlers.set(eventName, [...existing, handler]);
  }

  clear() {
    this.publishedEvents = [];
    this.handlers.clear();
  }
}
