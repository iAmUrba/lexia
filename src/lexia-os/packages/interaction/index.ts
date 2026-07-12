import { ID, DomainEvent } from "@lexia/shared";

export type Capability = "CanStartDraft" | "CanSign" | "CanArchive";

export class Workspace {
  constructor(
    public readonly id: ID,
    public activeWorkId: ID | null = null,
    public activeDocumentId: ID | null = null,
    public capabilities: Capability[] = [],
    public lastSync: Date = new Date()
  ) {}

  // ==========================================
  // SYNC FROM DOMAIN EVENTS (Event Sourcing Mental Model)
  // ==========================================
  sync(event: DomainEvent): void {
    if (event.type === "WorkStarted") {
      this.activeWorkId = event.payload.workId;
      this.capabilities = ["CanStartDraft"];
    } else if (event.type === "DraftStarted") {
      this.activeDocumentId = event.payload.docId;
      this.capabilities = []; // El doc ya inició
    } else if (event.type === "DocumentProjected") {
      this.capabilities = ["CanSign"]; // Simplificación: Asume que puede pedir firma
    } else if (event.type === "SignatureRequested") {
      this.capabilities = ["CanSign"];
    } else if (event.type === "DocumentSigned") {
      this.capabilities = ["CanArchive"];
    }
    
    this.lastSync = new Date();
    console.log(`[Workspace ${this.id.value.substring(0, 8)}] 🔄 Sincronizado con evento: ${event.type}. Capabilities actuales: ${this.capabilities.join(", ")}`);
  }

  can(capability: Capability): boolean {
    return this.capabilities.includes(capability);
  }
}
