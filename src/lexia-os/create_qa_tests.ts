import * as fs from 'fs';
import * as path from 'path';
import xlsx from 'xlsx';

const baseDir = path.join(process.cwd(), 'test', 'data');

function createCase(name: string, setup: (dir: string) => void) {
  const dir = path.join(baseDir, name);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  setup(dir);
  console.log(`Creado caso de prueba: ${name}`);
}

// Caso 1: Excel corrupto (archivo de texto con extensión xlsm)
createCase('QA_Excel_Corrupto', (dir) => {
  fs.writeFileSync(path.join(dir, '000IndiceElectronico.xlsm'), 'Esto no es un excel, va a explotar.');
  fs.mkdirSync(path.join(dir, 'C03Conocimiento'));
  fs.writeFileSync(path.join(dir, 'C03Conocimiento', '001Archivo.pdf'), 'PDF Falso');
});

// Caso 2: Carpeta sin PDFs pero con Excel (vacío)
createCase('QA_Carpeta_Vacia', (dir) => {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([
    [], [],
    ['', 'Juzgado Tercero Penal Del Circuito Especializado'],
    [],
    ['', '19001600000020210000000'],
    ['', 'Juan Perez'],
    [], [],
    ['001Escrito.pdf', '', '', 1]
  ]);
  xlsx.utils.book_append_sheet(wb, ws, 'Indice');
  xlsx.writeFile(wb, path.join(dir, '000IndiceElectronico.xlsm'));
  fs.mkdirSync(path.join(dir, 'C03Conocimiento'));
  // C03Conocimiento se queda vacía, no hay PDFs
});

// Caso 3: Archivos de 0 bytes (PDFs dañados)
createCase('QA_PDFs_Danados', (dir) => {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([
    [], [],
    ['', 'Juzgado Tercero Penal Del Circuito Especializado'],
    [],
    ['', '19001600000020210000000'],
    ['', 'Juan Perez'],
    [], [],
    ['001Escrito.pdf', '', '', 1],
    ['002Prueba.pdf', '', '', 2]
  ]);
  xlsx.utils.book_append_sheet(wb, ws, 'Indice');
  xlsx.writeFile(wb, path.join(dir, '000IndiceElectronico.xlsm'));
  fs.mkdirSync(path.join(dir, 'C03Conocimiento'));
  
  // Archivos de 0 bytes
  fs.writeFileSync(path.join(dir, 'C03Conocimiento', '001Escrito.pdf'), '');
  fs.writeFileSync(path.join(dir, 'C03Conocimiento', '002Prueba.pdf'), '');
});
