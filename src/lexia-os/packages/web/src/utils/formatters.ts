/**
 * Utilidades para formatear datos legales colombianos
 */

/**
 * Formatea un número de radicado colombiano de 23 dígitos (SPOA)
 * Formato original: 19001600072420210007700
 * Formato visual:   190016000724-2021-00077-00
 * 
 * Partes del SPOA (23 dígitos):
 * - Código Entidad (12 dígitos)
 * - Año (4 dígitos)
 * - Consecutivo (5 dígitos)
 * - Instancia (2 dígitos)
 */
export function formatRadicado(radicado: string): string {
  if (!radicado) return "";
  const cleaned = radicado.replace(/\D/g, ""); // Remover cualquier caracter no numérico
  
  if (cleaned.length === 23) {
    const entidad = cleaned.substring(0, 12);
    const año = cleaned.substring(12, 16);
    const consecutivo = cleaned.substring(16, 21);
    const instancia = cleaned.substring(21, 23);
    
    return `${entidad}-${año}-${consecutivo}-${instancia}`;
  }
  
  // Si no tiene exactamente 23 dígitos, devolverlo tal cual
  return radicado;
}

/**
 * Extrae el año de un radicado SPOA de 23 dígitos.
 * Devuelve null si el formato no coincide.
 */
export function extractYearFromRadicado(radicado: string): string | null {
  if (!radicado) return null;
  const cleaned = radicado.replace(/\D/g, "");
  
  if (cleaned.length === 23) {
    return cleaned.substring(12, 16);
  }
  
  return null;
}
