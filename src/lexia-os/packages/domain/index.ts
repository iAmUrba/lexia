import { ID, DomainEvent } from "@lexia/shared";

// ==========================================
// VALUE OBJECTS & TYPES
// ==========================================
export enum EventType {
  TutelaRecibida = "TutelaRecibida",
  MemorialRecibido = "MemorialRecibido",
  TerminoVencido = "TerminoVencido"
}

export enum WorkState {
  Pendiente = "Pendiente",
  EnProgreso = "EnProgreso",
  Bloqueado = "Bloqueado",
  Completado = "Completado"
}

export enum DocumentState {
  Borrador = "Borrador",
  Proyectado = "Proyectado",
  ListoParaFirma = "ListoParaFirma",
  Firmado = "Firmado",
  Notificado = "Notificado",
  Archivado = "Archivado"
}

// ==========================================
// ENTITIES & AGGREGATES
// ==========================================

export class Evento {
  constructor(
    public readonly id: ID,
    public readonly type: EventType,
    public readonly payload: any,
    public readonly timestamp: Date = new Date()
  ) {}
}

export type TrabajoSnapshot = {
  id: string;
  eventId: string;
  description: string;
  state: WorkState;
  createdAt: Date;
  version: number;
  metadata?: Record<string, any>;
  despacho_id: string;
};

export class Trabajo {
  private constructor(
    public readonly id: ID,
    public readonly eventId: ID,
    public description: string,
    public state: WorkState,
    public readonly createdAt: Date,
    public version: number = 0,
    public metadata: Record<string, any> = {},
    public readonly despacho_id: string = "default"
  ) {}

  static fromSnapshot(snapshot: TrabajoSnapshot): Trabajo {
    return new Trabajo(
      new ID(snapshot.id),
      new ID(snapshot.eventId),
      snapshot.description,
      snapshot.state,
      snapshot.createdAt,
      snapshot.version,
      snapshot.metadata || {},
      snapshot.despacho_id
    );
  }

  static createFromEvent(event: Evento, description: string, metadata: Record<string, any> = {}): Trabajo {
    return new Trabajo(ID.generate(), event.id, description, WorkState.Pendiente, new Date(), 0, metadata);
  }

  static iniciar(eventId: ID, description: string, despacho_id: string, metadata?: Record<string, any>): Trabajo {
    return new Trabajo(ID.generate(), eventId, description, WorkState.Pendiente, new Date(), 0, metadata || {}, despacho_id);
  }

  start(): void {
    if (this.state !== WorkState.Pendiente) throw new Error("Solo se puede iniciar un Trabajo Pendiente.");
    this.state = WorkState.EnProgreso;
    this.version += 1;
  }

  complete(resolutionNotes: string): void {
    if (this.state !== WorkState.EnProgreso) throw new Error("Solo se puede completar un Trabajo que está en progreso.");
    this.state = WorkState.Completado;
    this.version += 1;
  }

  block(reason: string): void {
    if (this.state !== WorkState.EnProgreso && this.state !== WorkState.Pendiente) {
      throw new Error("Solo un trabajo pendiente o en progreso puede ser bloqueado.");
    }
    this.state = WorkState.Bloqueado;
    this.version += 1;
  }

  updateMetadata(newMetadata: Record<string, any>, newDescription?: string): void {
    this.metadata = { ...this.metadata, ...newMetadata };
    if (newDescription) {
      this.description = newDescription;
    }
    this.version += 1;
  }

  static fromHistory(events: any[]): Trabajo | null {
    let trabajo: Trabajo | null = null;
    for (const event of events) {
      if (event.type === "WorkCreated") {
        trabajo = new Trabajo(event.payload.workId, event.payload.eventId, event.payload.description, WorkState.Pendiente, new Date(), 1, event.payload.metadata || {});
      } else if (trabajo) {
        if (event.type === "WorkStarted") { trabajo.state = WorkState.EnProgreso; trabajo.version += 1; }
        if (event.type === "WorkCompleted") { trabajo.state = WorkState.Completado; trabajo.version += 1; }
        if (event.type === "WorkBlocked") { trabajo.state = WorkState.Bloqueado; trabajo.version += 1; }
        if (event.type === "WorkMetadataUpdated") {
          trabajo.metadata = { ...trabajo.metadata, ...event.payload.metadata };
          if (event.payload.description) trabajo.description = event.payload.description;
          trabajo.version += 1;
        }
      }
    }
    return trabajo;
  }
}

export type DocumentoSnapshot = {
  id: string;
  workId: string;
  title: string;
  state: DocumentState;
  content: any;
  version: number;
  createdAt: Date;
};

export class Documento {
  private constructor(
    public readonly id: ID,
    public readonly workId: ID,
    public title: string,
    public state: DocumentState,
    public content: any,
    public version: number = 0,
    public readonly createdAt: Date = new Date()
  ) {}

  static fromSnapshot(snapshot: DocumentoSnapshot): Documento {
    return new Documento(
      new ID(snapshot.id),
      new ID(snapshot.workId),
      snapshot.title,
      snapshot.state,
      snapshot.content,
      snapshot.version,
      snapshot.createdAt
    );
  }

  static fromHistory(events: any[]): Documento | null {
    let doc: Documento | null = null;
    for (const event of events) {
      if (event.type === "DraftStarted") {
        doc = new Documento(event.payload.docId, event.payload.workId, event.payload.title || "Documento", DocumentState.Borrador, "", 1, new Date(event.occurredAt));
      } else if (doc) {
        if (event.type === "DocumentProjected") { doc.state = DocumentState.Proyectado; doc.version += 1; }
        if (event.type === "SignatureRequested") { doc.state = DocumentState.ListoParaFirma; doc.version += 1; }
        if (event.type === "DocumentSigned") { doc.state = DocumentState.Firmado; doc.version += 1; }
      }
    }
    return doc;
  }

  static startDrafting(workId: ID, title: string = "Fallo Proyectado"): Documento {
    return new Documento(ID.generate(), workId, title, DocumentState.Borrador, "", 0, new Date());
  }

  updateContent(content: any): void {
    if (this.state !== DocumentState.Borrador && this.state !== DocumentState.Proyectado) throw new Error("Solo se puede editar un Documento en Borrador o Proyectado.");
    this.content = content;
    this.version += 1;
  }

  finishProjection(): void {
    if (this.state !== DocumentState.Borrador) throw new Error("Solo un Borrador puede ser Proyectado.");
    this.state = DocumentState.Proyectado;
    this.version += 1;
  }

  requestSignature(): void {
    if (this.state !== DocumentState.Proyectado) throw new Error("Solo un documento Proyectado puede ser enviado a Firma.");
    this.state = DocumentState.ListoParaFirma;
    this.version += 1;
  }

  sign(): void {
    if (this.state !== DocumentState.ListoParaFirma) throw new Error("El documento no está listo para firma.");
    this.state = DocumentState.Firmado;
    this.version += 1;
  }
}

// ==========================================
// DOMAIN EVENTS (Records of what happened)
// ==========================================

export const createTutelaRecibidaEvent = (payload: { radicado: string; remitente: string }): DomainEvent => ({
  id: ID.generate(),
  occurredOn: new Date(),
  type: EventType.TutelaRecibida,
  payload
});

// LexIA Document Domain 2.0 (Asset-based)
export * from './document/index.js';
export * from './case/models.js';
export * from './case/contracts.js';
export * from './xai/contracts.js';
