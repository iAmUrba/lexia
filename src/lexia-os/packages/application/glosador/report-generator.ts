import { CaseInspectionResult } from './inspector';
import * as fs from 'fs';
import * as path from 'path';

export class ReportGenerator {
  public static printConsole(result: CaseInspectionResult) {
    console.log('\n====================================');
    console.log(`EXPEDIENTE: ${result.radicado}`);
    console.log(`PROCESADO: ${result.procesado}`);
    console.log(`JUZGADO: ${result.juzgado}`);
    console.log('====================================');
    console.log(`\nSALUD DEL EXPEDIENTE`);
    console.log(`${result.healthScore}/100 ${result.healthStatus}`);
    
    console.log('\n--- DETALLES ---');
    console.log(`${result.excelFound ? '✓' : '✗'} Excel encontrado`);
    console.log(`${result.knowledgeFolderFound ? '✓' : '✗'} Carpeta conocimiento encontrada`);
    
    console.log(`\nÚltimo documento Excel: ${result.lastExcelNumber.toString().padStart(3, '0')}`);
    console.log(`Último físico:          ${result.lastPhysicalNumber.toString().padStart(3, '0')}`);

    if (result.findings.risks.length > 0) {
      console.log('\nRIESGOS');
      result.findings.risks.forEach(r => console.log(r));
    }

    if (result.findings.warnings.length > 0) {
      console.log('\nHALLAZGOS');
      result.findings.warnings.forEach(w => console.log(w));
    }

    console.log('\nESTADÍSTICAS');
    console.log(`PDFs: ${result.stats.pdfCount}`);
    console.log(`Word: ${result.stats.wordCount}`);
    console.log(`Excel: ${result.stats.excelCount}`);
    console.log(`Carpetas: ${result.stats.folderCount}`);
    console.log(`Peso: ${(result.stats.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log('====================================\n');
  }

  public static generateHtml(result: CaseInspectionResult, outputPath: string) {
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Inspector - ${result.radicado}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f7f6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 900px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; margin-bottom: 20px; }
        .score { font-size: 2em; font-weight: bold; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
        .card-danger { border-left-color: #dc3545; }
        .card-warning { border-left-color: #ffc107; }
        h3 { margin-top: 0; color: #555; }
        ul { padding-left: 20px; }
        li { margin-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1>Expediente: ${result.radicado}</h1>
            <p><strong>Procesado:</strong> ${result.procesado}</p>
            <p><strong>Juzgado:</strong> ${result.juzgado}</p>
          </div>
          <div class="score">
            ${result.healthStatus} ${result.healthScore}/100
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Estadísticas</h3>
            <ul>
              <li>PDFs: ${result.stats.pdfCount}</li>
              <li>Documentos Word: ${result.stats.wordCount}</li>
              <li>Índices (Excel): ${result.stats.excelCount}</li>
              <li>Peso Total: ${(result.stats.totalSizeBytes / 1024 / 1024).toFixed(2)} MB</li>
            </ul>
          </div>
          <div class="card">
            <h3>Numeración</h3>
            <ul>
              <li>Último según Excel: <strong>${result.lastExcelNumber.toString().padStart(3, '0')}</strong></li>
              <li>Último documento físico: <strong>${result.lastPhysicalNumber.toString().padStart(3, '0')}</strong></li>
            </ul>
          </div>
        </div>

        ${result.findings.risks.length > 0 ? `
        <div class="card card-danger" style="margin-top: 20px;">
          <h3 style="color: #dc3545;">🔴 RIESGOS DETECTADOS</h3>
          <ul>
            ${result.findings.risks.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        ${result.findings.warnings.length > 0 ? `
        <div class="card card-warning" style="margin-top: 20px;">
          <h3 style="color: #d39e00;">⚠️ HALLAZGOS Y HUECOS</h3>
          <ul>
            ${result.findings.warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    </body>
    </html>
    `;
    fs.writeFileSync(outputPath, html);
    console.log(`Reporte HTML generado en: ${outputPath}`);
  }
}
