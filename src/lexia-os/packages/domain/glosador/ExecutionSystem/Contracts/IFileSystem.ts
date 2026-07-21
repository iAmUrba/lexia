export interface IFileSystem {
    exists(path: string): Promise<boolean>;
    calculateHash(path: string): Promise<string>;
    copyFile(source: string, destination: string): Promise<void>;
    deleteFile(path: string): Promise<void>;
    read(path: string): Promise<Buffer>;
    // TODO (Futuro): Procesamiento por chunks para archivos gigantes (100MB+)
    readStream(path: string): Promise<any>;
    write(path: string, data: Buffer): Promise<void>;
    move(source: string, destination: string): Promise<void>;
    list(path: string): Promise<string[]>;
    stat(path: string): Promise<{ size: number, lastModified: string }>;
    search?(query: string): Promise<any[]>;
}

export interface IExcelWriter {
    updateRow(path: string, rowData: any): Promise<void>;
}
