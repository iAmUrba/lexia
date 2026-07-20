export interface IFileSystem {
    exists(path: string): Promise<boolean>;
    calculateHash(path: string): Promise<string>;
    copyFile(source: string, destination: string): Promise<void>;
    deleteFile(path: string): Promise<void>;
    read(path: string): Promise<Buffer>;
    write(path: string, data: Buffer): Promise<void>;
    move(source: string, destination: string): Promise<void>;
    list(path: string): Promise<string[]>;
    stat(path: string): Promise<{ size: number, lastModified: string }>;
}

export interface IExcelWriter {
    updateRow(path: string, rowData: any): Promise<void>;
}
