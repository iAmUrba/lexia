import { EventStore } from "../../application/ports/EventStore.js";
import { DomainEvent } from "../../shared/index.js";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../../server/.data", "events.json");

export class InMemoryEventStoreAdapter implements EventStore {
  public storedEvents: DomainEvent[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        for (const item of data) {
          item.occurredAt = new Date(item.occurredAt);
          this.storedEvents.push(item);
        }
      }
    } catch (e) {
      console.error("Error loading events", e);
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.storedEvents, null, 2));
    } catch (e) {
      console.error("Error saving events", e);
    }
  }

  async append(events: DomainEvent[]): Promise<void> {
    this.storedEvents.push(...events);
    this.saveToDisk();
  }
}
