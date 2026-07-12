import { WorkRepository } from "./WorkRepository.js";
import { DocumentRepository } from "./DocumentRepository.js";
import { EventStore } from "./EventStore.js";

export interface ApplicationRepositories {
  workRepository: WorkRepository;
  documentRepository: DocumentRepository;
  eventStore: EventStore;
}

export interface UnitOfWork {
  run<T>(work: (repos: ApplicationRepositories) => Promise<T>): Promise<T>;
}
