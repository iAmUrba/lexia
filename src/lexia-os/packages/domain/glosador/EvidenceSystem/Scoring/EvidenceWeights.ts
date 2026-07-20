export const EvidenceWeights = {
  RADICADO: 100,
  SPOA: 100,
  CUI: 100,
  PROCESADO: 20,
  VICTIMA: 20,
  DEFENSOR: 10,
  FISCAL: 10,
  FECHA: 5,
};

export const Thresholds = {
  ENCONTRADO: 100, // Al menos el radicado o múltiples evidencias fuertes
  CONFLICTO_MARGEN: 20, // Si dos expedientes difieren en menos de 20 puntos, es conflicto
};
