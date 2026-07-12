import { ID, DomainEvent, Result, ok, err } from "../shared/index.js";
import { Trabajo, Documento } from "../domain/index.js";
import { UnitOfWork } from "./ports/UnitOfWork.js";

export class ResolverTutela {
  constructor(private uow: UnitOfWork) {}

  async iniciarTrabajo(eventId: ID, description: string, despacho_id: string, metadata: Record<string, any> = {}): Promise<Result<Trabajo>> {
    try {
      return await this.uow.run(async (repos) => {
        const trabajo = Trabajo.iniciar(eventId, description, despacho_id, metadata);
        trabajo.start(); 
        
        await repos.workRepository.save(trabajo);
        
        const domainEvent: DomainEvent = {
          eventId: ID.generate().value,
          type: "WorkCreated",
          aggregateId: trabajo.id.value,
          aggregateVersion: trabajo.version,
          occurredAt: new Date(),
          payload: { workId: trabajo.id.value, eventId: eventId.value, description, metadata, despacho_id }
        };
        
        await repos.eventStore.append([domainEvent]);
        return ok(trabajo);
      });
    } catch (e: any) {
      return err(e);
    }
  }

  async actualizarTrabajo(trabajoId: ID, metadata: Record<string, any>, description?: string): Promise<Result<Trabajo>> {
    try {
      return await this.uow.run(async (repos) => {
        const trabajo = await repos.workRepository.findById(trabajoId);
        if (!trabajo) return err(new Error("Trabajo no encontrado"));

        trabajo.updateMetadata(metadata, description);
        await repos.workRepository.save(trabajo);
        
        const domainEvent: DomainEvent = {
          eventId: ID.generate().value,
          type: "WorkMetadataUpdated",
          aggregateId: trabajo.id.value,
          aggregateVersion: trabajo.version,
          occurredAt: new Date(),
          payload: { workId: trabajo.id.value, metadata, description }
        };
        
        await repos.eventStore.append([domainEvent]);
        return ok(trabajo);
      });
    } catch (e: any) {
      return err(e);
    }
  }

  async crearDocumentoBorrador(trabajoId: ID, expectedVersion: number, title: string, content: any): Promise<Result<Documento>> {
    try {
      return await this.uow.run(async (repos) => {
        const trabajo = await repos.workRepository.findById(trabajoId);
        if (!trabajo) return err(new Error("Trabajo no encontrado"));
        if (trabajo.version !== expectedVersion) return err(new Error("OptimisticConcurrencyError: La versión del trabajo ha cambiado."));

        const doc = Documento.startDrafting(trabajo.id, title);
        doc.updateContent(content);
        
        trabajo.version += 1; 
        
        await repos.documentRepository.save(doc);
        await repos.workRepository.save(trabajo);
        
        const domainEvent: DomainEvent = {
          eventId: ID.generate().value,
          type: "DraftStarted",
          aggregateId: doc.id.value,
          aggregateVersion: doc.version,
          occurredAt: new Date(),
          payload: { docId: doc.id.value, workId: trabajo.id.value, title, content }
        };
        
        await repos.eventStore.append([domainEvent]);
        return ok(doc);
      });
    } catch (e: any) {
      return err(e);
    }
  }

  async proyectarFallo(docId: ID, expectedVersion: number, content: any): Promise<Result<Documento>> {
    try {
      return await this.uow.run(async (repos) => {
        let doc = await repos.documentRepository.findById(docId);
        if (!doc) return err(new Error("Documento no encontrado"));
        
        doc.updateContent(content);
        if (doc.state === "Borrador") {
          doc.finishProjection(); // Pasa a Proyectado
        }
        
        await repos.documentRepository.save(doc);
        
        const domainEvent: DomainEvent = {
          eventId: ID.generate().value,
          type: "DocumentUpdated",
          aggregateId: doc.id.value,
          aggregateVersion: doc.version,
          occurredAt: new Date(),
          payload: { docId: doc.id.value, workId: doc.workId.value, content }
        };
        
        await repos.eventStore.append([domainEvent]);
        return ok(doc);
      });
    } catch (e: any) {
      return err(e);
    }
  }

  async firmarFallo(docId: ID, expectedVersion: number): Promise<Result<Documento>> {
    try {
      return await this.uow.run(async (repos) => {
        const doc = await repos.documentRepository.findById(docId);
        if (!doc) return err(new Error("Documento no encontrado"));
        if (doc.version !== expectedVersion) return err(new Error("OptimisticConcurrencyError: La versión del documento ha cambiado."));

        if (doc.state === "Proyectado" as any) doc.requestSignature(); 
        doc.sign();
        
        await repos.documentRepository.save(doc);
        
        const domainEvent: DomainEvent = {
          eventId: ID.generate().value,
          type: "DocumentSigned",
          aggregateId: doc.id.value,
          aggregateVersion: doc.version,
          occurredAt: new Date(),
          payload: { docId: doc.id.value, workId: doc.workId.value }
        };
        
        await repos.eventStore.append([domainEvent]);
        return ok(doc);
      });
    } catch (e: any) {
      return err(e);
    }
  }

  async eliminarDocumento(docId: ID): Promise<Result<boolean>> {
    try {
      return await this.uow.run(async (repos) => {
        const doc = await repos.documentRepository.findById(docId);
        if (!doc) return err(new Error("Documento no encontrado"));
        // Utilizamos el método oficial para que se persista en disco o BD
        await repos.documentRepository.delete(docId);
        return ok(true);
      });
    } catch (e: any) {
      return err(e);
    }
  }
}
