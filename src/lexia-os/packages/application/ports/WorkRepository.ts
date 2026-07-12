import { ID } from "../../shared/index.js";
import { Trabajo } from "../../domain/index.js";

export interface WorkRepository {
  save(trabajo: Trabajo): Promise<void>;
  findById(id: ID): Promise<Trabajo | undefined>;
  findByEventId(eventId: ID): Promise<Trabajo | undefined>;
}
