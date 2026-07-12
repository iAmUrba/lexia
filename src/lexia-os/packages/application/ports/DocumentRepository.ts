import { ID } from "../../shared/index.js";
import { Documento } from "../../domain/index.js";

export interface DocumentRepository {
  save(doc: Documento): Promise<void>;
  findById(id: ID): Promise<Documento | undefined>;
  findByWorkId(workId: ID): Promise<Documento | undefined>;
  findByWorkIdAll(workId: ID): Promise<Documento[]>;
  delete(id: ID): Promise<void>;
}
