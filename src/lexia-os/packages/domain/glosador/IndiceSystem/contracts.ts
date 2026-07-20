export interface IndiceMetadata {
    nombre: string;
    version: string;
    fechaLectura: string;
    hash: string;
}

export interface IndiceRegistro {
    consecutivo: string | number | null;
    nombreDocumento: string;
    fecha?: string;
    isFormula?: boolean;
    hasError?: boolean;
    rawValues?: Record<string, any>;
}

export interface IndiceEstructura {
    formulas: number;
    celdasCombinadas: number;
    hojas: string[];
    columnas: string[];
    hasProtection?: boolean;
}

export interface IndiceData {
    metadata: IndiceMetadata;
    registros: IndiceRegistro[];
    estructura: IndiceEstructura;
}

export interface ConsecutivoProposal {
    siguienteConsecutivo: number | null;
    documentoAnterior: string | null;
    existenHuecos: boolean;
    huecos: number[];
    warnings: string[];
}

export interface IExcelAdapter {
    open(path: string): Promise<WorkbookData>;
}

export interface WorkbookData {
    sheets: SheetData[];
    getHash(): Promise<string>;
}

export interface SheetData {
    name: string;
    rows: any[][];
    // Simple representation of rows and cells
    // we'll pass metadata like formulas and merged cells
    formulasCount: number;
    mergedCellsCount: number;
    hasProtection: boolean;
}

export interface IIndiceReader {
    read(path: string): Promise<IndiceData>;
}
