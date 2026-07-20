// Patrones centrales y versionables para extracción de evidencias

export const Patterns = {
  // Radicados completos (21 a 23 dígitos)
  radicado: /\b\d{21,23}\b/g,
  
  // SPOA (Noticia Criminal de 21 dígitos)
  spoa: /\b\d{21}\b/g,
  
  // SPOA/Noticia Criminal explícito
  ni: /(?:SPOA|N\.?I\.?|Noticia Criminal)\s*:?\s*(\d+)/gi,
  
  // CUI
  cui: /(?:CUI|C\.U\.I\.?)\s*:?\s*([\w\d-]+)/gi,
  
  // Nombres procesado
  procesado: /(?:Procesado|Acusado|Contra|Indiciado|Imputado|Sindicado)\s*:\s*([a-zA-ZñÑáéíóúÁÉÍÓÚ ]{4,50})/gi,
  
  // Víctimas
  victima: /(?:Víctima|Victima|Agraviado)\s*:\s*([a-zA-ZñÑáéíóúÁÉÍÓÚ ]{4,50})/gi,
  
  // Defensores
  defensor: /(?:Defensor|Abogado|Apoderado)\s*:\s*([a-zA-ZñÑáéíóúÁÉÍÓÚ ]{4,50})/gi,
  
  // Fiscales
  fiscal: /(?:Fiscal|Delegado|Fiscalía)\s*:\s*([a-zA-ZñÑáéíóúÁÉÍÓÚ ]{4,50})/gi,
  
  // Fechas (dd/mm/yyyy o dd de mes de yyyy)
  fecha: /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/g,
  
  // Document Type
  documentType: /(Auto|Sentencia|Memorial|Acta|Informe|Constancia|Solicitud|Tutela)/i
};
