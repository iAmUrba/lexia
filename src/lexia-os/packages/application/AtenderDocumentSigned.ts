import { RegistrarNotificacion } from "./RegistrarNotificacion.js";

export class AtenderDocumentSigned {
  constructor(
    private registrarNotificacion: RegistrarNotificacion
  ) {}

  async handle(event: any): Promise<void> {
    if (event.type !== "DocumentSigned") return;
    
    // Al manejar el evento, creamos una nueva transacción a través de su caso de uso
    await this.registrarNotificacion.iniciar(event.eventId, "Notificación para el trabajo " + event.payload.workId);
  }
}
