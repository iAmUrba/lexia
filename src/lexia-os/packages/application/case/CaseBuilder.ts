import { Case, CaseIdentifiers, CaseDocument, CaseBuilderOptions } from '@lexia/domain';

export class CaseBuilder {
  private documents: CaseDocument[] = [];
  private radicado?: string;
  private nuc?: string;
  private interno?: string;
  
  constructor(private readonly caseId: string, private readonly options: CaseBuilderOptions = {}) {}

  /**
   * Añade un documento al expediente.
   */
  public addDocument(doc: CaseDocument): this {
    if (this.options.deduplicateDocuments) {
      if (this.documents.some(d => d.documentId === doc.documentId)) {
        return this; // Skip deduplicated
      }
    }
    this.documents.push(doc);
    
    // Sort deterministically by addedAt to ensure consistent state
    this.documents.sort((a, b) => a.addedAt.localeCompare(b.addedAt));
    
    return this;
  }

  /**
   * Establece los identificadores del caso.
   */
  public setIdentifiers(identifiers: CaseIdentifiers): this {
    if (identifiers.radicado && !this.options.allowMultipleRadicados) {
      // In a strict implementation, we would throw if assigning a different radicado, 
      // but for now we just use the first one set.
      if (!this.radicado) {
        this.radicado = identifiers.radicado;
      }
    } else if (identifiers.radicado) {
      this.radicado = identifiers.radicado;
    }
    
    if (identifiers.nuc) this.nuc = identifiers.nuc;
    if (identifiers.interno) this.interno = identifiers.interno;
    
    return this;
  }

  /**
   * Construye el agregado inmutable Case.
   */
  public build(): Case {
    return {
      id: this.caseId,
      identifiers: {
        radicado: this.radicado,
        nuc: this.nuc,
        interno: this.interno
      },
      documents: [...this.documents], // Copia inmutable
      participants: [], // Esto se poblará después con el ParticipantMerger
      timeline: { operations: [] }, // Esto se poblará después con el TimelineMerger
      events: [] // Historial de eventos
    };
  }
}
