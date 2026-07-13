export interface IFileSystem {
  read(path: string): Promise<Buffer>;
  write(path: string, content: Buffer | string): Promise<void>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
}
