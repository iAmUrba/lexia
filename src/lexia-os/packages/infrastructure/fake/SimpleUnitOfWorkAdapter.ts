import { UnitOfWork, ApplicationRepositories } from "../../application/ports/UnitOfWork.js";

export class SimpleUnitOfWorkAdapter implements UnitOfWork {
  constructor(private repos: ApplicationRepositories) {}

  async run<T>(work: (repos: ApplicationRepositories) => Promise<T>): Promise<T> {
    // Para InMemory y Fake, no hay rollback real de BD, simplemente ejecutamos.
    return await work(this.repos);
  }
}
