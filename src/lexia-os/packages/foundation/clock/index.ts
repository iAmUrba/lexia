export class Clock {
  /**
   * Retorna la fecha y hora actual.
   * Centralizar esto permite, en el futuro, inyectar tiempos simulados para pruebas.
   */
  static now(): Date {
    return new Date();
  }

  /**
   * Retorna el timestamp actual en milisegundos.
   */
  static timestamp(): number {
    return Date.now();
  }
}
