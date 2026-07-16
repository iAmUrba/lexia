import * as fs from 'fs';
import * as path from 'path';
import { StorageProvider } from '../../domain/glosador/StorageProvider/StorageProvider.js';

export class FileSystemStorageProvider implements StorageProvider {
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  async findExpedienteFolders(query: string): Promise<string[]> {
    if (!fs.existsSync(this.rootDir)) return [];
    
    // Simplification for the MVP: we assume expedientes are one level deep, 
    // or we just search the root directory for matches.
    const items = fs.readdirSync(this.rootDir, { withFileTypes: true });
    
    const results: string[] = [];
    for (const item of items) {
      if (item.isDirectory() && item.name.toLowerCase().includes(query.toLowerCase())) {
        results.push(path.join(this.rootDir, item.name));
      }
    }
    return results;
  }

  async findKnowledgeFolder(expedientePath: string): Promise<string | null> {
    if (!fs.existsSync(expedientePath)) return null;
    
    const items = fs.readdirSync(expedientePath, { withFileTypes: true });
    // Usually named "Cuaderno Conocimiento" or similar
    const knowledgeFolder = items.find(i => i.isDirectory() && i.name.toLowerCase().includes('conocimiento'));
    
    if (knowledgeFolder) {
      return path.join(expedientePath, knowledgeFolder.name);
    }
    return null;
  }

  async listFilesInFolder(folderPath: string): Promise<string[]> {
    if (!fs.existsSync(folderPath)) return [];
    return fs.readdirSync(folderPath);
  }

  async downloadFile(filePath: string): Promise<string> {
    // In local FileSystem, the file is already "downloaded".
    return filePath;
  }

  async uploadFile(localFilePath: string, targetPath: string): Promise<void> {
    fs.copyFileSync(localFilePath, targetPath);
  }

  async moveFile(sourcePath: string, targetPath: string): Promise<void> {
    fs.renameSync(sourcePath, targetPath);
  }

  async createBackup(targetPath: string): Promise<string> {
    if (fs.existsSync(targetPath)) {
      const backupPath = targetPath + `.backup-${Date.now()}`;
      fs.copyFileSync(targetPath, backupPath);
      return backupPath;
    }
    return '';
  }
}
