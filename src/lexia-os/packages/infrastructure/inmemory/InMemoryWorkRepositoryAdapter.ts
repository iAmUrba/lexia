import { ID } from "../../shared/index.js";
import { Trabajo } from "../../domain/index.js";
import { WorkRepository } from "../../application/ports/WorkRepository.js";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../../server/.data", "works.json");
console.log("DEBUG: works DATA_FILE is", DATA_FILE);

export class InMemoryWorkRepositoryAdapter implements WorkRepository {
  public map = new Map<string, Trabajo>();

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        for (const item of data) {
          item.createdAt = new Date(item.createdAt);
          if (!item.despacho_id) {
            item.despacho_id = "juzgado_3_especializado";
          }
          const t = Trabajo.fromSnapshot(item);
          this.map.set(t.id.value, t);
        }
      }
    } catch (e) {
      console.error("Error loading works", e);
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = Array.from(this.map.values()).map(w => ({
        id: w.id.value,
        eventId: w.eventId.value,
        description: w.description,
        state: w.state,
        createdAt: w.createdAt,
        version: w.version,
        metadata: w.metadata,
        despacho_id: (w as any).despacho_id || "juzgado_3_especializado"
      }));
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Error saving works", e);
    }
  }

  async save(trabajo: Trabajo): Promise<void> {
    this.map.set(trabajo.id.value, trabajo);
    this.saveToDisk();
  }

  async findById(id: ID): Promise<Trabajo | undefined> {
    return this.map.get(id.value);
  }

  async findByEventId(eventId: ID): Promise<Trabajo | undefined> {
    for (const t of this.map.values()) {
      if (t.eventId.value === eventId.value) return t;
    }
    return undefined;
  }
}
