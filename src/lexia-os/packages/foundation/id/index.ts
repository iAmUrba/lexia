import { randomUUID } from "crypto";

export class Id {
  /**
   * Genera un identificador único (UUID v4 estándar).
   * Encapsular esto asegura que si mañana cambiamos a UUID v7 o NanoID,
   * solo modificamos este archivo.
   */
  static generate(): string {
    return randomUUID();
  }
}
