export interface CreateTutelaRequest {
  eventId: string;
  description?: string;
  radicado: string;
  procesados: Array<{
    nombre: string;
    cedula: string;
    detenido: boolean;
    defensor?: {
      nombre: string;
      tipo: "confianza" | "publico";
      tp?: string;
      cedula?: string;
      telefono?: string;
    }
  }>;
  demandante?: string;
  delitos: string[];
  fiscal: {
    nombre: string;
    despacho: string;
    seccional: string;
  };
  ministerio_publico: {
    nombre: string;
    despacho: string;
    seccional: string;
  };
  victimas?: string;
  representante_victimas?: string;
}
