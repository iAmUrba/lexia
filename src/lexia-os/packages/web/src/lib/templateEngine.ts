// Motor de plantillas simple
export type FieldType = "text" | "date" | "time" | "select" | "multiselect" | "textarea" | "textarea-ai";

export interface TemplateField {
  name: string;
  label: string;
  type: FieldType;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface DocumentTemplate {
  id: string;
  category: "Resoluciones" | "Secretaría" | "Notificaciones";
  name: string;
  description: string;
  fields: TemplateField[];
  templateString: string;
}

// Catálogo de plantillas
export const templatesCatalog: DocumentTemplate[] = [
  {
    id: "constancia_aplazamiento",
    category: "Secretaría",
    name: "Constancia de aplazamiento",
    description: "Genera una constancia para reprogramar audiencias.",
    fields: [
      { name: "fecha_solicitud", label: "Fecha en que se recibió la solicitud", type: "date" },
      { name: "fecha", label: "Fecha de la audiencia", type: "date" },
      { name: "hora", label: "Hora de la audiencia", type: "time" },
      { name: "tipo_audiencia", label: "Tipo de Audiencia (Etapa)", type: "select", options: [
        { label: "Formulación de Imputación", value: "AUDIENCIA DE FORMULACIÓN DE IMPUTACIÓN" },
        { label: "Formulación de Acusación", value: "AUDIENCIA DE FORMULACIÓN DE ACUSACIÓN" },
        { label: "Audiencia Preparatoria", value: "AUDIENCIA PREPARATORIA" },
        { label: "Juicio Oral", value: "AUDIENCIA DE JUICIO ORAL" },
        { label: "Verificación de Preacuerdo", value: "AUDIENCIA DE VERIFICACIÓN DE PREACUERDO" },
        { label: "Incidente de Reparación Integral", value: "AUDIENCIA DE INCIDENTE DE REPARACIÓN INTEGRAL" }
      ]},
      { name: "quien_solicito", label: "Quién solicitó el aplazamiento", type: "multiselect", options: [
        { label: "Fiscalía", value: "la Fiscalía General de la Nación" },
        { label: "Defensa", value: "la Defensa" },
        { label: "Despacho", value: "el Despacho" },
        { label: "Procesado", value: "el Procesado" },
        { label: "Representante de Víctimas", value: "el Representante de Víctimas" },
        { label: "Ministerio Público", value: "el Ministerio Público" }
      ]},
      { name: "motivo", label: "Motivo del aplazamiento", type: "textarea", placeholder: "Ej. manifiesta a este despacho que se encuentra en reuniones..." }
    ],
    templateString: `<p>El suscrito {{usuario_cargo}} del {{usuario_despacho}},</p>

<p style="text-align: center;"><strong>HACE CONSTAR:</strong></p>

<p>El día {{fecha_texto}}, no se realizó la <strong>{{tipo_audiencia}}</strong>, dentro del proceso con radicado <strong>{{radicado}}</strong> en contra de <strong>{{procesados}}</strong> identificado con cédula número <strong>{{cedulas}}</strong> acusado por los delitos de <strong>{{delitos}}</strong>. Lo anterior en atención a la solicitud de <strong>{{quien_solicito}}</strong>, quien manifiesta a este despacho que {{motivo}}. Por esta razón, el Despacho procedió a reprogramar dicha diligencia.</p>

<p>Para constancia, firmo en Popayán-Cauca a los [Día_Actual] días del mes de [Mes_Actual] de [Año_Actual].</p>


<p style="text-align: center;">
<img src="{{usuario_firma_url}}" alt="Firma" width="150" /><br>
<strong>{{usuario_nombre}}</strong><br>
<strong>{{usuario_cargo}}</strong>
</p>`
  },
  {
    id: "auto_admisorio",
    category: "Resoluciones",
    name: "Auto Admisorio",
    description: "Plantilla para auto admisorio de demanda.",
    fields: [],
    templateString: `AUTO ADMISORIO...`
  }
];

export function generateProseMirrorContent(template: DocumentTemplate, formData: Record<string, any>, expedienteData?: any, user?: any) {
  let text = template.templateString;
  
  const processedFormData: Record<string, string> = { ...formData };
  
  // Format multiselect arrays into natural language "A, B y C"
  Object.keys(formData).forEach(key => {
    if (Array.isArray(formData[key])) {
      let arr = [...formData[key]];
      
      // Reemplazo especial para "la Fiscalía General de la Nación"
      const meta = expedienteData?.work?.metadata || expedienteData?.metadata;
      if (meta?.fiscal && arr.includes("la Fiscalía General de la Nación")) {
        const fiscalNombre = typeof meta.fiscal === 'string' ? meta.fiscal : meta.fiscal.nombre;
        const fiscalDespacho = typeof meta.fiscal === 'object' && meta.fiscal.despacho ? meta.fiscal.despacho : "la Fiscalía General de la Nación";
        // Let the AI Supervisor resolve el/la doctor(a) based on the name
        const fiscalStr = `el/la doctor(a) ${fiscalNombre}, de ${fiscalDespacho}`;
        arr = arr.map(item => item === "la Fiscalía General de la Nación" ? fiscalStr : item);
      }
      
      if (arr.length === 0) processedFormData[key] = "";
      else if (arr.length === 1) processedFormData[key] = arr[0];
      else if (arr.length === 2) processedFormData[key] = `${arr[0]} y ${arr[1]}`;
      else {
        const last = arr.pop();
        processedFormData[key] = `${arr.join(", ")} y ${last}`;
      }
    }
  });

  // Format time fields into 12-hour format
  Object.keys(formData).forEach(key => {
    const fieldDef = template.fields?.find(f => f.name === key);
    if (fieldDef?.type === "time" && formData[key]) {
      const [hourStr, minStr] = formData[key].split(':');
      let h = parseInt(hourStr, 10);
      const ampm = h >= 12 ? 'p.m.' : 'a.m.';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      processedFormData[key] = `${h}:${minStr} ${ampm}`;
    }
  });

  // Reemplazar las variables de la plantilla iterando sobre las claves procesadas
  Object.keys(processedFormData).forEach(key => {
    const value = processedFormData[key] || "";
    const regex = new RegExp(`{{${key}}}`, 'g');
    text = text.replace(regex, value);
  });

  // Generar fecha_texto si se ingresaron fecha y hora
  if (formData.fecha && formData.hora) {
    const [year, month, day] = formData.fecha.split('-');
    const [hourStr, minStr] = formData.hora.split(':');
    let h = parseInt(hourStr, 10);
    const m = parseInt(minStr, 10);
    const ampm = h >= 12 ? 'p.m.' : 'a.m.';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const formattedM = m.toString().padStart(2, '0');
    const fechaTextoFormatted = `${diasSemana[dateObj.getDay()]} ${day} de ${meses[parseInt(month) - 1]} de ${year} a las ${h}:${formattedM} ${ampm}`;
    text = text.replace(/\{\{fecha_texto\}\}/g, fechaTextoFormatted);
  } else {
    text = text.replace(/\{\{fecha_texto\}\}/g, '[Fecha y hora]');
  }

  // Reemplazar variables de expediente si existen
  const meta = expedienteData?.work?.metadata || expedienteData?.metadata;
  if (meta) {
    text = text.replace(/{{radicado}}/g, meta.radicado || '[Radicado]');
    const delitosStr = Array.isArray(meta.delitos) ? meta.delitos.join(' - ').toUpperCase() : (meta.delitos ? meta.delitos.toUpperCase() : '[Delitos]');
    text = text.replace(/{{delitos}}/g, delitosStr);
    
    if (meta.procesados && meta.procesados.length > 0) {
      const nombres = meta.procesados.map((p: any) => p.nombre).join(' y ');
      const cedulas = meta.procesados.map((p: any) => p.cedula).join(' y ');
      text = text.replace(/{{procesados}}/g, nombres);
      text = text.replace(/{{cedulas}}/g, cedulas);
    }
  }

  // Reemplazar variables dinámicas como fecha de firma
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const numeros = ["uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve", "treinta", "treinta y uno"];
  
  // Usar la fecha de solicitud si existe, de lo contrario usar la actual
  let dateFirma = new Date();
  if (formData.fecha_solicitud) {
    const [y, m, d] = formData.fecha_solicitud.split('-');
    dateFirma = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }
  
  const diaTexto = numeros[dateFirma.getDate() - 1] || dateFirma.getDate().toString();
  text = text.replace(/\[Día_Actual\]/g, `${diaTexto} (${dateFirma.getDate()})`);
  text = text.replace(/\[Mes_Actual\]/g, meses[dateFirma.getMonth()]);
  
  const yearText = dateFirma.getFullYear() === 2026 ? "veintiséis" : 
                   dateFirma.getFullYear() === 2024 ? "veinticuatro" : 
                   dateFirma.getFullYear() === 2025 ? "veinticinco" : 
                   dateFirma.getFullYear() === 2027 ? "veintisiete" : dateFirma.getFullYear().toString();
                   
  text = text.replace(/\[Año_Actual\]/g, "dos mil " + yearText + ` (${dateFirma.getFullYear()})`);
                   
  // Reemplazar variables de usuario
  if (user) {
    text = text.replace(/{{usuario_cargo}}/g, user.cargo || '[Cargo del Usuario]');
    text = text.replace(/{{usuario_despacho}}/g, user.despacho || '[Despacho del Usuario]');
    text = text.replace(/{{usuario_nombre}}/g, user.nombre_completo || '[Nombre del Usuario]');
    text = text.replace(/{{usuario_firma_url}}/g, user.firmaUrl || 'https://via.placeholder.com/150x50?text=Sin+Firma');
  } else {
    text = text.replace(/{{usuario_cargo}}/g, '[Cargo del Usuario]');
    text = text.replace(/{{usuario_despacho}}/g, '[Despacho del Usuario]');
    text = text.replace(/{{usuario_nombre}}/g, '[Nombre del Usuario]');
    text = text.replace(/{{usuario_firma_url}}/g, '');
  }
                   
  return text;
}
