import { StorageProvider } from '../../domain/glosador/StorageProvider/StorageProvider.js';
import { Client } from '@microsoft/microsoft-graph-client';
import fs from 'fs';
import path from 'path';

export class MicrosoftGraphStorageProvider implements StorageProvider {
  private client: Client;
  private inputFolderId: string;

  constructor(accessToken: string, inputFolderId: string) {
    this.client = Client.init({
      authProvider: (done) => done(null, accessToken)
    });
    this.inputFolderId = inputFolderId;
  }

  async findExpedienteFolders(radicado: string): Promise<string[]> {
    // Buscar en todo el OneDrive usando search()
    try {
      const result = await this.client.api(`/me/drive/root/search(q='${radicado}')`).get();
      // Filtrar solo las carpetas
      const folders = result.value.filter((item: any) => item.folder);
      return folders.map((f: any) => f.id); // Devolvemos el Graph ID de las carpetas encontradas
    } catch (e: any) {
      console.error('Error buscando expediente en Graph:', e.message);
      return [];
    }
  }

  async listFilesInFolder(folderPath: string): Promise<string[]> {
    // folderPath aquí será tratado como el Folder ID
    try {
      const items = await this.client.api(`/me/drive/items/${folderPath}/children`).get();
      const files = items.value.filter((item: any) => item.file && item.name.toLowerCase().endsWith('.pdf'));
      return files.map((f: any) => f.id); // Retornamos los File IDs
    } catch (e: any) {
      console.error('Error listando archivos:', e.message);
      return [];
    }
  }

  async getFileMetadata(filePath: string): Promise<{ size: number; mtime: Date }> {
    try {
      const item = await this.client.api(`/me/drive/items/${filePath}`).get();
      return {
        size: item.size,
        mtime: new Date(item.lastModifiedDateTime)
      };
    } catch (e) {
      return { size: 0, mtime: new Date() };
    }
  }

  async moveFile(sourcePath: string, destPath: string, newFileName: string): Promise<void> {
    // Mover y renombrar en Microsoft Graph
    // sourcePath = File ID
    // destPath = Target Folder ID
    try {
      await this.client.api(`/me/drive/items/${sourcePath}`).patch({
        name: newFileName,
        parentReference: {
          id: destPath
        }
      });
    } catch (e: any) {
      console.error('Error moviendo archivo en Graph:', e.message);
      throw new Error(`Error moviendo a Microsoft 365: ${e.message}`);
    }
  }

  // Método auxiliar para descargar el PDF a una ruta temporal de Node para el PdfAnalyzer
  async downloadFile(fileId: string): Promise<string> {
    try {
      const item = await this.client.api(`/me/drive/items/${fileId}`).get();
      const downloadUrl = item['@microsoft.graph.downloadUrl'];
      const response = await fetch(downloadUrl);
      const buffer = await response.arrayBuffer();
      
      const tempPath = path.join(process.cwd(), '.temp', `${fileId}.pdf`);
      // Asegurar que el directorio .temp exista
      if (!fs.existsSync(path.dirname(tempPath))) {
        fs.mkdirSync(path.dirname(tempPath), { recursive: true });
      }
      
      fs.writeFileSync(tempPath, Buffer.from(buffer));
      return tempPath;
    } catch (e: any) {
      console.error('Error descargando archivo:', e.message);
      throw e;
    }
  }
}
