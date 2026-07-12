import { ID } from "../../shared/index.js";
import { Trabajo } from "../../domain/index.js";
import { WorkRepository } from "../../application/ports/WorkRepository.js";

export class FakePersistentWorkRepositoryAdapter implements WorkRepository {
  private fakeDb = new Map<string, string>(); // Simula guardar como JSON strings

  async save(trabajo: Trabajo): Promise<void> {
    this.fakeDb.set(trabajo.id.value, JSON.stringify(trabajo));
  }

  async findById(id: ID): Promise<Trabajo | undefined> {
    const data = this.fakeDb.get(id.value);
    if (!data) return undefined;
    const parsed = JSON.parse(data);
    return Trabajo.fromSnapshot({
      id: parsed.id._value,
      eventId: parsed.eventId._value,
      description: parsed.description,
      state: parsed.state,
      createdAt: new Date(parsed.createdAt),
      version: parsed.version
    });
  }

  async findByEventId(eventId: ID): Promise<Trabajo | undefined> {
    for (const data of this.fakeDb.values()) {
      const parsed = JSON.parse(data);
      if (parsed.eventId._value === eventId.value) {
        return Trabajo.fromSnapshot({
          id: parsed.id._value,
          eventId: parsed.eventId._value,
          description: parsed.description,
          state: parsed.state,
          createdAt: new Date(parsed.createdAt),
          version: parsed.version
        });
      }
    }
    return undefined;
  }
}
