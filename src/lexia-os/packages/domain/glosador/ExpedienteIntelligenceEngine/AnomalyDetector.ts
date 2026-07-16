import { ElectronicIndex } from './ElectronicIndex.js';

export interface Anomaly {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  type: 'MISSING_FILE' | 'DUPLICATE_CONSECUTIVE' | 'ORPHAN_FILE' | 'GAP_CONSECUTIVE' | 'OUT_OF_ORDER' | 'NAME_MISMATCH' | 'IMPOSSIBLE_DATE';
  diagnostic: string;
  risk: string;
  suggestedAction: string;
  automationLevel: 'AUTO' | 'ASSISTED' | 'MANUAL' | 'BLOCKED';
}

export class AnomalyDetector {
  scan(index: ElectronicIndex, physicalFileNames: string[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // 1. Consecutivos faltantes físicos (Missing files)
    const missing = index.documents.filter(d => !d.existeFisicamente);
    for (const doc of missing) {
      anomalies.push({
        severity: 'CRITICAL',
        type: 'MISSING_FILE',
        diagnostic: `Documento ${doc.consecutivo} (${doc.nombre}) no existe físicamente en la carpeta.`,
        risk: `Ruptura de la trazabilidad del expediente. Riesgo de nulidad procesal.`,
        suggestedAction: 'Buscar documento en carpeta JUAN DAVID o contactar archivo.',
        automationLevel: 'MANUAL'
      });
    }

    // 2. Duplicidad de Consecutivos en el Índice
    const counts = new Map<number, number>();
    for (const doc of index.documents) {
      counts.set(doc.consecutivo, (counts.get(doc.consecutivo) || 0) + 1);
    }
    counts.forEach((count, consecutivo) => {
      if (count > 1) {
        anomalies.push({
          severity: 'CRITICAL',
          type: 'DUPLICATE_CONSECUTIVE',
          diagnostic: `El consecutivo ${consecutivo} está repetido ${count} veces en el índice.`,
          risk: `Desorden en la indexación. Confusión en el reparto o en la lectura de la segunda instancia.`,
          suggestedAction: 'Reasignar consecutivos duplicados.',
          automationLevel: 'ASSISTED'
        });
      }
    });

    // 3. Saltos de Consecutivo (Gaps)
    let expected = 1;
    const sortedConsecutivos = Array.from(counts.keys()).sort((a, b) => a - b);
    for (const consecutivo of sortedConsecutivos) {
      if (consecutivo > expected) {
        if (expected === 1) {
          anomalies.push({
            severity: 'INFO',
            type: 'GAP_CONSECUTIVE',
            diagnostic: `El índice inicia en el consecutivo ${consecutivo}.`,
            risk: `Ninguno si corresponde a un tomo o cuaderno nuevo.`,
            suggestedAction: `Verificar si los consecutivos del 1 al ${consecutivo - 1} están en un cuaderno anterior.`,
            automationLevel: 'ASSISTED'
          });
        } else {
          anomalies.push({
            severity: 'WARNING',
            type: 'GAP_CONSECUTIVE',
            diagnostic: `Falta documentación entre los consecutivos ${expected - 1} y ${consecutivo}.`,
            risk: `Ocultamiento de piezas procesales.`,
            suggestedAction: `Revisar si existen documentos físicos sin glosar o corregir salto numérico.`,
            automationLevel: 'MANUAL'
          });
        }
      }
      expected = consecutivo + 1;
    }

    // 4. Archivos Huérfanos
    for (const file of physicalFileNames) {
      const isRegistered = index.documents.some(doc => doc.nombreArchivo === file);
      if (!isRegistered) {
        const lowerFile = file.toLowerCase();
        
        if (lowerFile.includes('(1)') || lowerFile.includes('copia') || lowerFile.includes('final') || lowerFile.includes('firmado') || lowerFile.endsWith('.tmp')) {
           anomalies.push({
             severity: 'WARNING',
             type: 'ORPHAN_FILE',
             diagnostic: `Archivo detectado: "${file}". Parece ser una versión duplicada o borrador no registrado.`,
             risk: `Desorden en la carpeta física, posible confusión.`,
             suggestedAction: `Verificar su validez y eliminar el archivo si es redundante.`,
             automationLevel: 'BLOCKED' // LexIA NUNCA debe borrar archivos sola
           });
        } else {
           const lastConsecutive = sortedConsecutivos.length > 0 ? sortedConsecutivos[sortedConsecutivos.length - 1] : 0;
           anomalies.push({
             severity: 'WARNING',
             type: 'ORPHAN_FILE',
             diagnostic: `Documento físico "${file}" sin registro en el índice electrónico.`,
             risk: `Actuación no contabilizada en el inventario oficial.`,
             suggestedAction: `Agregar al índice electrónico con consecutivo sugerido: ${lastConsecutive + 1}.`,
             automationLevel: 'AUTO'
           });
        }
      }
    }

    return anomalies;
  }
}



