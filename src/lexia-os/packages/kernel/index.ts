import { Evento, Trabajo, Documento } from "@lexia/domain";
import { ID, Result, ok, err } from "@lexia/shared";

// ==========================================
// REPOSITORIES (Interfaces)
// ==========================================
export interface TrabajoRepository {
  save(trabajo: Trabajo): void;
  findById(id: ID): Trabajo | undefined;
}

export interface DocumentoRepository {
  save(documento: Documento): void;
  findById(id: ID): Documento | undefined;
}

// ==========================================
// COMMAND HANDLERS
// ==========================================

export class Kernel {
  constructor(
    private trabajos: TrabajoRepository,
    private documentos: DocumentoRepository,
    private eventBus: (event: any) => void = () => {}
  ) {}

  // 1. CreateWorkFromEvent
  createWorkFromEvent(evento: Evento, description: string): Result<Trabajo> {
    try {
      const trabajo = Trabajo.createFromEvent(evento, description);
      this.trabajos.save(trabajo);
      console.log(`[Kernel] 🟢 Trabajo Creado: ${trabajo.id.value} (Estado: ${trabajo.state})`);
      this.eventBus({ type: "WorkCreated", payload: { workId: trabajo.id, eventId: evento.id, description } });
      return ok(trabajo);
    } catch (e: any) {
      return err(e);
    }
  }

  // 2. StartWork (Generico, sin crear borrador inmediatamente)
  startWork(workId: ID): Result<Trabajo> {
    try {
      const trabajo = this.trabajos.findById(workId);
      if (!trabajo) return err(new Error("Trabajo no encontrado"));
      
      trabajo.start(); // Cambia a EnProgreso
      this.trabajos.save(trabajo);
      
      console.log(`[Kernel] 🟢 Trabajo Iniciado: ${trabajo.id.value}`);
      this.eventBus({ type: "WorkStarted", payload: { workId: trabajo.id } });
      return ok(trabajo);
    } catch (e: any) {
      return err(e);
    }
  }

  // 3. StartDraft
  startDraft(workId: ID): Result<Documento> {
    try {
      const trabajo = this.trabajos.findById(workId);
      if (!trabajo) return err(new Error("Trabajo no encontrado"));
      
      // Asegurar que el trabajo está en progreso antes de crear documentos
      if (trabajo.state === "Pendiente") {
        trabajo.start();
        this.trabajos.save(trabajo);
      }
      
      const doc = Documento.startDrafting(trabajo.id);
      this.documentos.save(doc);
      
      console.log(`[Kernel] 🟢 Borrador Iniciado: ${doc.id.value} para el Trabajo: ${trabajo.id.value} (Estado Trabajo: ${trabajo.state})`);
      this.eventBus({ type: "DraftStarted", payload: { docId: doc.id, workId: trabajo.id } });
      return ok(doc);
    } catch (e: any) {
      return err(e);
    }
  }

  // 3. FinishProjection
  finishProjection(docId: ID, content: string): Result<Documento> {
    try {
      const doc = this.documentos.findById(docId);
      if (!doc) return err(new Error("Documento no encontrado"));

      doc.updateContent(content);
      doc.finishProjection();
      this.documentos.save(doc);

      console.log(`[Kernel] 🟢 Documento Proyectado: ${doc.id.value} (Estado Doc: ${doc.state})`);
      this.eventBus({ type: "DocumentProjected", payload: { docId: doc.id } });
      return ok(doc);
    } catch (e: any) {
      return err(e);
    }
  }

  // 4. RequestSignature
  requestSignature(docId: ID): Result<Documento> {
    try {
      const doc = this.documentos.findById(docId);
      if (!doc) return err(new Error("Documento no encontrado"));

      doc.requestSignature();
      this.documentos.save(doc);

      console.log(`[Kernel] 🟢 Documento Listo para Firma: ${doc.id.value}`);
      this.eventBus({ type: "SignatureRequested", payload: { docId: doc.id } });
      return ok(doc);
    } catch (e: any) {
      return err(e);
    }
  }

  // 6. SignDocument
  signDocument(docId: ID): Result<Documento> {
    try {
      const doc = this.documentos.findById(docId);
      if (!doc) return err(new Error("Documento no encontrado"));

      doc.sign();
      this.documentos.save(doc);

      console.log(`[Kernel] 🟢 Documento FIRMADO: ${doc.id.value} (Estado: ${doc.state})`);
      this.eventBus({ type: "DocumentSigned", payload: { docId: doc.id } });
      return ok(doc);
    } catch (e: any) {
      return err(e);
    }
  }

  // 7. CompleteWork
  completeWork(workId: ID, resolutionNotes: string): Result<Trabajo> {
    try {
      const trabajo = this.trabajos.findById(workId);
      if (!trabajo) return err(new Error("Trabajo no encontrado"));

      trabajo.complete(resolutionNotes);
      this.trabajos.save(trabajo);

      console.log(`[Kernel] 🟢 Trabajo COMPLETADO: ${trabajo.id.value}`);
      this.eventBus({ type: "WorkCompleted", payload: { workId: trabajo.id, resolutionNotes } });
      return ok(trabajo);
    } catch (e: any) {
      return err(e);
    }
  }

  // 8. BlockWork
  blockWork(workId: ID, reason: string): Result<Trabajo> {
    try {
      const trabajo = this.trabajos.findById(workId);
      if (!trabajo) return err(new Error("Trabajo no encontrado"));

      trabajo.block(reason);
      this.trabajos.save(trabajo);

      console.log(`[Kernel] 🔴 Trabajo BLOQUEADO: ${trabajo.id.value} (Razón: ${reason})`);
      this.eventBus({ type: "WorkBlocked", payload: { workId: trabajo.id, reason } });
      return ok(trabajo);
    } catch (e: any) {
      return err(e);
    }
  }
}
