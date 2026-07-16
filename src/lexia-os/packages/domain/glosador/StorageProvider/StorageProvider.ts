export interface StorageProvider {
  /**
   * Busca carpetas de expedientes en el almacenamiento que coincidan con la query (Radicado o Nombre).
   */
  findExpedienteFolders(query: string): Promise<string[]>;

  /**
   * Busca la carpeta específica de conocimiento (ej. *Conocimiento*) dentro del expediente dado.
   */
  findKnowledgeFolder(expedientePath: string): Promise<string | null>;

  /**
   * Lista todos los archivos que hay dentro de una carpeta dada.
   */
  listFilesInFolder(folderPath: string): Promise<string[]>;

  /**
   * Abre o descarga temporalmente un archivo (ej. el Excel 000IndiceElectronico).
   * Devuelve la ruta donde se encuentra el archivo accesible localmente.
   */
  downloadFile(filePath: string): Promise<string>;

  /**
   * Sube o sobreescribe un archivo en el almacenamiento remoto/local.
   */
  uploadFile(localFilePath: string, targetPath: string): Promise<void>;

  /**
   * Mueve un archivo de una ruta a otra en el almacenamiento.
   */
  moveFile(sourcePath: string, targetPath: string): Promise<void>;
  
  /**
   * Realiza una copia de seguridad del archivo antes de tocarlo.
   */
  createBackup(targetPath: string): Promise<string>;
}
