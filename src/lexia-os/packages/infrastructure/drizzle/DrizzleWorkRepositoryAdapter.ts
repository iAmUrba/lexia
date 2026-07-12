import { eq } from "drizzle-orm";
import { ID } from "../../shared/index.js";
import { Trabajo } from "../../domain/index.js";
import { WorkRepository } from "../../application/ports/WorkRepository.js";
import { works } from "./schema.js";
import { DrizzleWorkMapper } from "./work.mapper.js";

// Extraemos el tipo que comparten db y tx en Drizzle con pg-core/pglite
// Usamos any por conveniencia temporal para no acoplar el adapter a los genéricos complejos de Drizzle
type DrizzleClient = any;

export class DrizzleWorkRepositoryAdapter implements WorkRepository {
  constructor(private db: DrizzleClient) {}

  async save(trabajo: Trabajo): Promise<void> {
    const row = DrizzleWorkMapper.toRow(trabajo);
    
    await this.db
      .insert(works)
      .values(row)
      .onConflictDoUpdate({
        target: works.id,
        set: row
      });
  }

  async findById(id: ID): Promise<Trabajo | undefined> {
    const rows = await this.db.select().from(works).where(eq(works.id, id.value)).limit(1);
    if (rows.length === 0) return undefined;
    return DrizzleWorkMapper.toDomain(rows[0]);
  }

  async findByEventId(eventId: ID): Promise<Trabajo | undefined> {
    const rows = await this.db.select().from(works).where(eq(works.eventId, eventId.value)).limit(1);
    if (rows.length === 0) return undefined;
    return DrizzleWorkMapper.toDomain(rows[0]);
  }
}
