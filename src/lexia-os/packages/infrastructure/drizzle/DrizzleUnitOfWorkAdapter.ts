import { UnitOfWork, ApplicationRepositories } from "../../application/ports/UnitOfWork.js";
import { DrizzleWorkRepositoryAdapter } from "./DrizzleWorkRepositoryAdapter.js";
import { DrizzleDocumentRepositoryAdapter } from "./DrizzleDocumentRepositoryAdapter.js";
import { DrizzleEventStoreAdapter } from "./DrizzleEventStoreAdapter.js";

export class DrizzleUnitOfWorkAdapter implements UnitOfWork {
  constructor(private db: any) {} // Instancia de drizzle(pg)

  async run<T>(work: (repos: ApplicationRepositories) => Promise<T>): Promise<T> {
    return await this.db.transaction(async (tx: any) => {
      // Instanciamos repositorios atados a la transacción actual
      const repos: ApplicationRepositories = {
        workRepository: new DrizzleWorkRepositoryAdapter(tx),
        documentRepository: new DrizzleDocumentRepositoryAdapter(tx),
        eventStore: new DrizzleEventStoreAdapter(tx)
      };
      
      return await work(repos);
    });
  }
}
