import * as fs from 'fs';
import * as path from 'path';
import xlsx from 'xlsx';

const baseDir = path.join(process.cwd(), 'test', 'simulator_data');

function createCase(name: string, radicado: string, procesado: string, juzgado: string, lastNum: number) {
  const dir = path.join(baseDir, 'cases', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, 'C03Conocimiento'));
  
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([
    ['x'], ['x'],
    ['x', juzgado],
    ['x'],
    ['x', radicado],
    ['x', procesado],
    ['x'], ['x'],
    [`${String(lastNum).padStart(3, '0')}Anterior.pdf`, '', '', lastNum]
  ]);
  xlsx.utils.book_append_sheet(wb, ws, 'Indice');
  xlsx.writeFile(wb, path.join(dir, '000IndiceElectronico.xlsm'));
  
  fs.writeFileSync(path.join(dir, 'C03Conocimiento', `${String(lastNum).padStart(3, '0')}Anterior.pdf`), 'Fake PDF');
}

function createInboxPDF(name: string, text: string) {
  const inboxDir = path.join(baseDir, 'inbox');
  fs.mkdirSync(inboxDir, { recursive: true });
  // Creating a fake PDF that pdf-parse won't choke on. Wait, pdf-parse parses binary PDFs.
  // Actually, to make pdf-parse work, we just need a minimal valid PDF.
  // A minimal valid PDF:
  const pdfHeader = "%PDF-1.4\n";
  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n";
  // The text needs to be in the stream. (simplified)
  const streamData = `BT /F1 12 Tf 100 700 Td (${text}) Tj ET`;
  const obj4 = `4 0 obj\n<< /Length ${streamData.length} >>\nstream\n${streamData}\nendstream\nendobj\n`;
  const xref = "xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000289 00000 n \n";
  const trailer = "trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n386\n%%EOF";
  const pdfContent = pdfHeader + obj1 + obj2 + obj3 + obj4 + xref + trailer;

  fs.writeFileSync(path.join(inboxDir, name), pdfContent);
}

if (fs.existsSync(baseDir)) fs.rmSync(baseDir, { recursive: true, force: true });
fs.mkdirSync(baseDir, { recursive: true });

// Expedientes
createCase('19001600000020210007700', '19001600000020210007700', 'HOLMAN DANIEL GARCES LEDEZMA', 'Juzgado Tercero Penal del Circuito Especializado', 106);
createCase('19001600000020210008800', '19001600000020210008800', 'JUAN PEREZ GONZALEZ', 'Juzgado 01 Penal del Circuito', 45);

// Inbox
createInboxPDF('Solicitud_Fiscalia_Holman.pdf', 'Juzgado 03 penal radicado 19001600000020210007700 contra holman daniel');
createInboxPDF('Memorial_Juan.pdf', 'Para el expediente de JUAN PEREZ');
createInboxPDF('Oficio_Desconocido.pdf', 'Este documento no menciona a nadie');

console.log('Datos de simulacion creados.');
