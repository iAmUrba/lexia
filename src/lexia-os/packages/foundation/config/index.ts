import { ConfigurationError } from '../errors/index.js';

export class Config {
  /**
   * Obtiene una variable de entorno.
   * Lanza un ConfigurationError si la variable es requerida y no existe.
   */
  static get(key: string, required: boolean = true, defaultValue?: string): string {
    const value = process.env[key];
    
    if (value === undefined || value.trim() === '') {
      if (required && defaultValue === undefined) {
        throw new ConfigurationError(`Variable de entorno requerida no encontrada: ${key}`);
      }
      return defaultValue as string;
    }
    
    return value;
  }
}
