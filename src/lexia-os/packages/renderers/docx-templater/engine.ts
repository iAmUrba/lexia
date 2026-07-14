import { DocumentModel } from '@lexia/domain';
import { TemplateEngine } from './index.js';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export class DocxtemplaterEngine implements TemplateEngine {
  async render(template: Buffer, model: DocumentModel): Promise<Buffer> {
    const zip = new PizZip(template);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Reconstruir un objeto anidado a partir de DocumentField[] (ej. "header.radicado")
    const templateData: any = { title: model.title };
    
    for (const field of model.fields) {
      const parts = field.id.split('.');
      let current = templateData;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) current[part] = {};
        current = current[part];
      }
      current[parts[parts.length - 1]] = field.value;
    }

    doc.render(templateData);

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buf;
  }
}
