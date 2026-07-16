export interface DocumentEntry {
  consecutivo: number;
  nombre: string;
  fecha: string;
  paginas: number;
  peso?: number; // En bytes
  existeFisicamente: boolean;
  nombreArchivo?: string;
}

export interface ElectronicIndex {
  metadata: {
    radicado: string;
    procesado: string;
    despacho: string;
    juez?: string;
    fiscal?: string;
    delitos?: string;
  };
  documents: DocumentEntry[];
}
