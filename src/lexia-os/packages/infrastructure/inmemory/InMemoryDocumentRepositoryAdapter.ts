import { ID } from "../../shared/index.js";
import { Documento } from "../../domain/index.js";
import { DocumentRepository } from "../../application/ports/DocumentRepository.js";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../../server/.data", "documents.json");

export class InMemoryDocumentRepositoryAdapter implements DocumentRepository {
  public map = new Map<string, Documento>();

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        for (const item of data) {
          item.createdAt = new Date(item.createdAt);
          const doc = Documento.fromSnapshot(item);
          this.map.set(doc.id.value, doc);
        }
      }
    } catch (e) {
      console.error("Error loading documents", e);
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = Array.from(this.map.values()).map(d => ({
        id: d.id.value,
        workId: d.workId.value,
        title: d.title,
        state: d.state,
        content: d.content,
        version: d.version,
        createdAt: d.createdAt
      }));
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Error saving documents", e);
    }
  }

  async save(doc: Documento): Promise<void> {
    this.map.set(doc.id.value, doc);
    this.saveToDisk();
  }

  async findById(id: ID): Promise<Documento | undefined> {
    return this.map.get(id.value);
  }

  async findByWorkId(workId: ID): Promise<Documento | undefined> {
    for (const doc of this.map.values()) {
      if (doc.workId.value === workId.value) return doc;
    }
    return undefined;
  }

  async findByWorkIdAll(workId: ID): Promise<Documento[]> {
    const docs: Documento[] = [];
    for (const doc of this.map.values()) {
      if (doc.workId.value === workId.value) docs.push(doc);
    }
    return docs;
  }

  async delete(id: ID): Promise<void> {
    this.map.delete(id.value);
    this.saveToDisk();
  }
}
