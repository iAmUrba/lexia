import { ID } from "../../shared/index.js";
import { Documento } from "../../domain/index.js";
import { DocumentRepository } from "../../application/ports/DocumentRepository.js";

export class FakePersistentDocumentRepositoryAdapter implements DocumentRepository {
  private fakeDb = new Map<string, string>(); // Serialización a JSON

  async save(doc: Documento): Promise<void> {
    this.fakeDb.set(doc.id.value, JSON.stringify(doc));
  }

  async findById(id: ID): Promise<Documento | undefined> {
    const data = this.fakeDb.get(id.value);
    if (!data) return undefined;
    const parsed = JSON.parse(data);
    return Documento.fromSnapshot({
      id: parsed.id._value || parsed.id.value,
      workId: parsed.workId._value || parsed.workId.value,
      title: parsed.title || "Documento",
      state: parsed.state,
      content: parsed.content,
      version: parsed.version,
      createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date()
    });
  }

  async findByWorkId(workId: ID): Promise<Documento | undefined> {
    for (const data of this.fakeDb.values()) {
      const parsed = JSON.parse(data);
      const wid = parsed.workId._value || parsed.workId.value;
      if (wid === workId.value) {
        return Documento.fromSnapshot({
          id: parsed.id._value || parsed.id.value,
          workId: wid,
          title: parsed.title || "Documento",
          state: parsed.state,
          content: parsed.content,
          version: parsed.version,
          createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date()
        });
      }
    }
    return undefined;
  }

  async findByWorkIdAll(workId: ID): Promise<Documento[]> {
    const docs: Documento[] = [];
    for (const data of this.fakeDb.values()) {
      const parsed = JSON.parse(data);
      const wid = parsed.workId._value || parsed.workId.value;
      if (wid === workId.value) {
        docs.push(Documento.fromSnapshot({
          id: parsed.id._value || parsed.id.value,
          workId: wid,
          title: parsed.title || "Documento",
          state: parsed.state,
          content: parsed.content,
          version: parsed.version,
          createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date()
        }));
      }
    }
    return docs;
  }
}
