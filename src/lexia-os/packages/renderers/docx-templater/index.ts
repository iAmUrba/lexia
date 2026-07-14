import { DocumentModel, DocumentRenderer } from '@lexia/domain';

/**
 * Abstracción interna para no acoplarnos a una librería específica de renderizado.
 */
export interface TemplateEngine {
  render(template: Buffer, model: DocumentModel): Promise<Buffer>;
}

export class DocxRenderer implements DocumentRenderer<Buffer> {
  constructor(private engine: TemplateEngine) {}

  async render(model: DocumentModel, templatePathOrBuffer?: string | Buffer): Promise<Buffer> {
    if (!templatePathOrBuffer) {
      throw new Error('DocxRenderer requiere un templatePath o Buffer de la plantilla');
    }

    let templateBuffer: Buffer;
    
    if (Buffer.isBuffer(templatePathOrBuffer)) {
      templateBuffer = templatePathOrBuffer;
    } else {
      // Import filesystem on demand to keep the class unit-testable if needed
      const fs = await import('fs');
      if (!fs.existsSync(templatePathOrBuffer as string)) {
        throw new Error(`Plantilla no encontrada: ${templatePathOrBuffer}`);
      }
      templateBuffer = fs.readFileSync(templatePathOrBuffer as string);
    }

    return this.engine.render(templateBuffer, model);
  }
}
