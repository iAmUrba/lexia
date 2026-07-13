export interface ExtractedPdfData {
  text: string;
  numpages: number;
  metadata: {
    author?: string;
    title?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
  };
  isEncrypted: boolean;
}

export interface PdfExtractor {
  extract(buffer: Buffer): Promise<ExtractedPdfData>;
}
