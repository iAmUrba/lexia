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

    // We pass the flat fields and sections/evidence if needed
    // Assuming the word template uses markers like {{radicado}} mapped to model.fields.radicado
    doc.render({
      ...model.fields,
      title: model.title,
      // For more complex templates, we can pass the whole model
      // but keeping it flat at the top level is usually easier for the template designers
      header: model.fields.header || {},
      hearing: model.fields.hearing || {},
      participants: model.fields.participants || {}
    });

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buf;
  }
}
