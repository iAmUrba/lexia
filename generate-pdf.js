const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

(async () => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Auto_123');
  pdfDoc.setAuthor('Juzgado Central');
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('Este es un documento PDF real extraido por LexIA.', { x: 50, y: 700, size: 20, font });
  const pdfBytes = await pdfDoc.save();
  fs.mkdirSync('fixtures', {recursive: true});
  fs.writeFileSync('fixtures/simple.pdf', pdfBytes);
  console.log('Created fixtures/simple.pdf');
})();
