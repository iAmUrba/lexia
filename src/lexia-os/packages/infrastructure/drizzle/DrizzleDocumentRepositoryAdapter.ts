import { eq } from "drizzle-orm";
import { ID } from "../../shared/index.js";
import { Documento } from "../../domain/index.js";
import { DocumentRepository } from "../../application/ports/DocumentRepository.js";
import { documents } from "./schema.js";

type DrizzleClient = any;

export class DrizzleDocumentRepositoryAdapter implements DocumentRepository {
  constructor(private db: DrizzleClient) {}

  async save(doc: Documento): Promise<void> {
    const row = {
      id: doc.id.value,
      workId: doc.workId.value,
      state: doc.state,
      content: doc.content,
      version: doc.version
    };
    
    await this.db
      .insert(documents)
      .values(row)
      .onConflictDoUpdate({
        target: documents.id,
        set: row
      });
  }

  async findById(id: ID): Promise<Documento | undefined> {
    const rows = await this.db.select().from(documents).where(eq(documents.id, id.value)).limit(1);
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return Documento.fromSnapshot({
      id: row.id,
      workId: row.workId,
      state: row.state as any,
      content: row.content || "",
      version: row.version
    });
  }

  async findByWorkId(workId: ID): Promise<Documento | undefined> {
    const rows = await this.db.select().from(documents).where(eq(documents.workId, workId.value)).limit(1);
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return Documento.fromSnapshot({
      id: row.id,
      workId: row.workId,
      state: row.state as any,
      content: row.content || "",
      version: row.version
    });
  }
  async findByWorkIdAll(workId: ID): Promise<Documento[]> {
    const rows = await this.db.select().from(documents).where(eq(documents.workId, workId.value));
    return rows.map((row: any) => Documento.fromSnapshot({
      id: row.id,
      workId: row.workId,
      state: row.state as any,
      content: row.content || "",
      version: row.version
    }));
  }

  async delete(id: ID): Promise<void> {
    await this.db.delete(documents).where(eq(documents.id, id.value));
  }
}
