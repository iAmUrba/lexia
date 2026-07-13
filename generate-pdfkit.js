const PDFDocument = require('pdfkit');
const fs = require('fs');

fs.mkdirSync('fixtures', {recursive: true});

const doc = new PDFDocument({
  info: {
    Title: 'Auto_123',
    Author: 'Juzgado Central'
  }
});

const stream = fs.createWriteStream('fixtures/simple.pdf');
doc.pipe(stream);

doc.fontSize(20).text('Este es un documento PDF real extraido por LexIA.', 50, 50);
doc.end();

stream.on('finish', () => {
  console.log('Created simple.pdf via pdfkit (flushed)');
});
