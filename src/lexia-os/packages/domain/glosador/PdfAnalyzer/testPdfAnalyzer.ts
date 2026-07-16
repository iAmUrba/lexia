import { PdfAnalyzer, InputDocument } from './PdfAnalyzer';

async function runSprint1() {
  const analyzer = new PdfAnalyzer();

  const mockDocs: InputDocument[] = [
    {
      id: 'doc-1',
      sourceType: 'FILESYSTEM',
      originalName: 'memorial.pdf',
      sourcePath: '/mock/memorial.pdf',
      extractedText: 'Señor Juez, ref. proceso 19001600072420210007700 solicito audiencia.'
    },
    {
      id: 'doc-2',
      sourceType: 'EMAIL',
      originalName: 'poder.pdf',
      sourcePath: '/mock/poder.pdf',
      extractedText: 'El Procesado: HOLMAN GARCES ARBOLEDA otorga poder especial...'
    },
    {
      id: 'doc-3',
      sourceType: 'WHATSAPP',
      originalName: 'foto_cedula.pdf',
      sourcePath: '/mock/foto_cedula.pdf',
      extractedText: 'C.C. 1012345678 exp. en Bogotá'
    },
    {
      id: 'doc-4',
      sourceType: 'FILESYSTEM',
      originalName: 'oficio_vacio.pdf',
      sourcePath: '/mock/oficio_vacio.pdf',
      extractedText: 'Oficio remisorio del expediente para su conocimiento.'
    }
  ];

  console.log('### Sprint 1 Reporte\n');

  for (const doc of mockDocs) {
    const start = performance.now();
    const result = await analyzer.analyze(doc);
    const end = performance.now();
    
    console.log(`Documento: ${doc.originalName}`);
    if (result.radicado) {
      console.log(`✅ Radicado encontrado: ${result.radicado}`);
    } else if (result.procesado) {
      console.log(`✅ Nombre encontrado: ${result.procesado}`);
    } else if (result.cedula) {
      console.log(`✅ Cédula encontrada: ${result.cedula}`);
    } else {
      console.log(`⚠️ No encontró coincidencias (Estado: Manual)`);
    }
    console.log(`Tiempo: ${(end - start).toFixed(2)} ms`);
    console.log('---\n');
  }
}

runSprint1();
