import ExcelJS from 'exceljs';
import { StorageProvider } from '../../StorageProvider/StorageProvider.js';
import { ElectronicIndex, DocumentEntry } from './ElectronicIndex.js';

export class ExcelReader {
  constructor(private storageProvider: StorageProvider) {}

  async parseIndex(excelIdOrPath: string): Promise<ElectronicIndex> {
    const localPath = await this.storageProvider.downloadFile(excelIdOrPath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(localPath);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error("No se encontró ninguna hoja en el Excel");
    }

    // 1. Extracción dinámica de Metadata (Cabecera)
    // Buscamos palabras clave en las primeras filas
    let radicado = "Desconocido";
    let procesado = "Desconocido";
    let despacho = "Desconocido";

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 20) return; // Limitamos la búsqueda de metadata
      const text = row.values.toString().toLowerCase();
      
      if (text.includes("radicado")) {
         // Intentamos extraer el radicado de esta fila o la siguiente celda
         const match = text.match(/\d{21,23}/);
         if (match) radicado = match[0];
      }
      if (text.includes("demandado") || text.includes("procesado") || text.includes("imputado")) {
         // Buscar en las celdas adyacentes
         row.eachCell((cell, colNumber) => {
           if (cell.value && typeof cell.value === 'string' && (cell.value.toLowerCase().includes("procesado") || cell.value.toLowerCase().includes("demandado"))) {
              const nextCell = row.getCell(colNumber + 1).value;
              if (nextCell) procesado = nextCell.toString();
           }
         });
      }
      if (text.includes("juzgado")) {
         despacho = text; // Captura cruda para MVP
      }
    });

    // 2. Extracción de Columnas Dinámica
    let headerRowNumber = 0;
    const colMap: { [key: string]: number } = {};

    // Buscar dónde empieza la tabla
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (headerRowNumber > 0) return; // Ya lo encontramos
      
      const rowText = row.values.toString().toLowerCase();
      if (rowText.includes("consecutivo") || rowText.includes("documento") || rowText.includes("fecha")) {
        headerRowNumber = rowNumber;
        // Mapear columnas
        row.eachCell((cell, colNumber) => {
           const val = cell.value?.toString().toLowerCase().trim();
           if (!val) return;
           if (val.includes("consecutivo") || val === "no" || val === "no.") colMap["consecutivo"] = colNumber;
           else if (val.includes("fecha")) colMap["fecha"] = colNumber;
           else if (val.includes("documento") || val.includes("actuación")) colMap["documento"] = colNumber;
           else if (val.includes("página") || val.includes("folio")) colMap["paginas"] = colNumber;
           else if (val.includes("peso") || val.includes("tamaño")) colMap["peso"] = colNumber;
        });
      }
    });

    if (headerRowNumber === 0) {
      throw new Error("No se pudo detectar el inicio de la tabla (encabezados desconocidos)");
    }

    // 3. Extracción de Documentos
    const documents: DocumentEntry[] = [];
    
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= headerRowNumber) return; // Saltar cabecera
      
      const consecutivoCell = colMap["consecutivo"] ? row.getCell(colMap["consecutivo"]).value : null;
      if (!consecutivoCell) return; // Fila vacía
      
      const consecutivo = Number(consecutivoCell);
      if (isNaN(consecutivo)) return; // No es un documento válido

      const nombre = colMap["documento"] ? row.getCell(colMap["documento"]).value?.toString() || "" : "";
      const fecha = colMap["fecha"] ? row.getCell(colMap["fecha"]).value?.toString() || "" : "";
      const paginas = colMap["paginas"] ? Number(row.getCell(colMap["paginas"]).value) : 1;
      
      documents.push({
        consecutivo,
        nombre,
        fecha,
        paginas: isNaN(paginas) ? 1 : paginas,
        existeFisicamente: false // Inicialmente falso, se actualizará en otro paso
      });
    });

    return {
      metadata: { radicado, procesado, despacho },
      documents
    };
  }
}
