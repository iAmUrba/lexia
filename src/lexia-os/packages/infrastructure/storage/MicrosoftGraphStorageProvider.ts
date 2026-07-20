import { StorageProvider } from '../../domain/glosador/StorageProvider/StorageProvider.js';
import { getSharePointHeaders } from '../http/routes/m365.routes.js';
import fs from 'fs';
import path from 'path';

export class MicrosoftGraphStorageProvider implements StorageProvider {
  private inputFolderId: string;

  constructor(accessToken: string, inputFolderId: string) {
    // ignoramos el accessToken porque ahora usamos las cookies directamente
    this.inputFolderId = inputFolderId;
  }

  async findExpedienteFolders(radicado: string): Promise<string[]> {
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root/search(q='${radicado}')`, {
        headers: getSharePointHeaders()
      });
      if (!res.ok) return [];
      const result = await res.json();
      const folders = result.value.filter((item: any) => item.folder);
      return folders.map((f: any) => f.id);
    } catch (e: any) {
      console.error('Error buscando expediente en SharePoint:', e.message);
      return [];
    }
  }

  async listFilesInFolder(folderPath: string): Promise<string[]> {
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${folderPath}/children`, {
        headers: getSharePointHeaders()
      });
      if (!res.ok) return [];
      const items = await res.json();
      const files = items.value.filter((item: any) => item.file && item.name.toLowerCase().endsWith('.pdf'));
      return files.map((f: any) => f.id);
    } catch (e: any) {
      console.error('Error listando archivos:', e.message);
      return [];
    }
  }

  async getFileMetadata(filePath: string): Promise<{ size: number; mtime: Date }> {
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${filePath}`, {
        headers: getSharePointHeaders()
      });
      if (!res.ok) throw new Error('Not found');
      const item = await res.json();
      return {
        size: item.size,
        mtime: new Date(item.lastModifiedDateTime)
      };
    } catch (e) {
      return { size: 0, mtime: new Date() };
    }
  }

  async moveFile(sourcePath: string, destPath: string, newFileName: string): Promise<void> {
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${sourcePath}`, {
        method: 'PATCH',
        headers: {
          ...getSharePointHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFileName,
          parentReference: { id: destPath }
        })
      });
      if (!res.ok) {
         const err = await res.text();
         throw new Error(`Error moviendo archivo: ${err}`);
      }
    } catch (e: any) {
      console.error('Error moviendo archivo en SharePoint:', e.message);
      throw new Error(`Error moviendo a Microsoft 365: ${e.message}`);
    }
  }

  async downloadFile(fileId: string): Promise<string> {
    try {
      const itemRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`, {
        headers: getSharePointHeaders()
      });
      if (!itemRes.ok) throw new Error('File not found');
      const item = await itemRes.json();
      const downloadUrl = item['@microsoft.graph.downloadUrl'];
      
      const response = await fetch(downloadUrl);
      const buffer = await response.arrayBuffer();
      
      const tempPath = path.join(process.cwd(), '.temp', `${fileId}.pdf`);
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
