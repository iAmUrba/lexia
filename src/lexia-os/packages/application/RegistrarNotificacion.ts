import { ID, DomainEvent, Result, ok } from "../shared/index.js";
import { Trabajo } from "../domain/index.js";
import { UnitOfWork } from "./ports/UnitOfWork.js";

export class RegistrarNotificacion {
  constructor(private uow: UnitOfWork) {}

  async iniciar(sourceEventId: string, description: string): Promise<Result<Trabajo>> {
    try {
      return await this.uow.run(async (repos) => {
        const mockEvent = { id: new ID(sourceEventId) } as any;
        const trabajo = Trabajo.createFromEvent(mockEvent, description);
        trabajo.start();
        
        await repos.workRepository.save(trabajo);
        
        const domainEvent: DomainEvent = {
          eventId: ID.generate().value,
          type: "WorkCreated",
          aggregateId: trabajo.id.value,
          aggregateVersion: trabajo.version,
          occurredAt: new Date(),
          payload: { workId: trabajo.id.value, eventId: sourceEventId, description }
        };
        
        await repos.eventStore.append([domainEvent]);
        return ok(trabajo);
      });
    } catch (e: any) {
      return err(e);
    }
  }
}
