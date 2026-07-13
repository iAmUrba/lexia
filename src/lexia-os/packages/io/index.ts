export type SourceOrigin = 'FileSystem' | 'Email' | 'HTTP' | 'Memory';

export interface DocumentSource {
  readonly origin: SourceOrigin;
  readonly pathOrUri: string;
  readonly filename?: string;
  readonly byteSize?: number;
  readonly receivedAt: number;
}

export interface DocumentStream {
  readonly source: DocumentSource;
  
  /**
   * Carga todo el documento en memoria (sólo recomendado para docs ligeros)
   */
  readAllAsBuffer(): Promise<Buffer>;
  
  /**
   * Lee un chunk específico para análisis rápido (ej. magic bytes)
   */
  readChunk(start: number, end: number): Promise<Buffer>;

  /**
   * Retorna un ReadableStream de Node para procesamiento pesado sin agotar memoria
   */
  getStream(): NodeJS.ReadableStream;
}
