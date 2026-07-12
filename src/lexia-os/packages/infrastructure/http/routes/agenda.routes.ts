import { FastifyInstance } from "fastify";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

// Tipo para el evento
export interface AgendaEvent {
  id: string;
  datetime: string;
  description: string;
  status: "programado" | "completado";
  despacho_id?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta a agenda.json en la raíz del backend (packages/server)
const AGENDA_PATH = path.join(__dirname, "../../../server/agenda.json");

let cachedAgenda: AgendaEvent[] | null = null;

function loadAgenda(): AgendaEvent[] {
  if (cachedAgenda) return cachedAgenda;
  
  try {
    const data = fs.readFileSync(AGENDA_PATH, "utf-8");
    cachedAgenda = JSON.parse(data) as AgendaEvent[];
    // Ordenar por fecha ascendentemente
    cachedAgenda.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    return cachedAgenda;
  } catch (error) {
    console.error("No se pudo cargar agenda.json", error);
    return [];
  }
}

export default async function agendaRoutes(app: FastifyInstance) {
  
  app.get("/", async (request, reply) => {
    let agenda = loadAgenda();
    const rol = request.headers['x-lexia-rol'] as string;
    const despachoId = request.headers['x-lexia-despacho'] as string;
    
    if (rol !== 'admin' && despachoId) {
      agenda = agenda.filter(a => !a.despacho_id || a.despacho_id === despachoId || a.despacho_id === "juzgado_3_especializado");
    }
    
    return { data: agenda };
  });

  app.get("/hoy", async (request, reply) => {
    let agenda = loadAgenda();
    const rol = request.headers['x-lexia-rol'] as string;
    const despachoId = request.headers['x-lexia-despacho'] as string;
    
    if (rol !== 'admin' && despachoId) {
      agenda = agenda.filter(a => !a.despacho_id || a.despacho_id === despachoId || a.despacho_id === "juzgado_3_especializado");
    }
    
    // Obtener la fecha "hoy" (usamos la fecha local de servidor)
    const today = new Date();
    // NOTA: Para propósitos de simulación, permitimos forzar la fecha por query params (ej. ?fecha=2026-08-03)
    const query = request.query as { fecha?: string };
    
    let todayStr = "";
    if (query.fecha) {
      // Si nos pasan la fecha, la usamos directamente para evitar problemas de zona horaria
      todayStr = query.fecha; 
    } else {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      todayStr = `${year}-${month}-${day}`; // Ej: "2026-08-03"
    }
    
    // Filtrar eventos que empiecen por esa fecha (formato YYYY-MM-DDTHH:MM:SS)
    const eventsToday = agenda.filter(evt => evt.datetime.startsWith(todayStr));
    
    return { 
      date: todayStr,
      count: eventsToday.length,
      data: eventsToday 
    };
  });

  // POST /api/agenda/export - Exporta agenda semanal a DOCX
  app.post("/export", async (request, reply) => {
    const body = request.body as { start_date: string; month_str: string; events: AgendaEvent[] };
    if (!body.start_date || !body.month_str || !body.events) {
      return reply.code(400).send({ error: "Missing required fields" });
    }

    const serverDir = path.join(__dirname, "../../../server");
    const tmpDir = path.join(serverDir, "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const timestamp = Date.now();
    const eventsPath = path.join(tmpDir, `events_${timestamp}.json`);
    const outputPath = path.join(tmpDir, `export_${timestamp}.docx`);
    const templatePath = path.join(serverDir, "templates", "membrete.docx");
    const scriptPath = path.join(serverDir, "export_agenda.py");

    fs.writeFileSync(eventsPath, JSON.stringify(body.events, null, 2), "utf-8");

    try {
      const { exec } = await import("child_process");
      const util = await import("util");
      const execAsync = util.promisify(exec);

      // Run python script
      const cmd = `python3 "${scriptPath}" --events "${eventsPath}" --template "${templatePath}" --output "${outputPath}" --month_str "${body.month_str}" --start_date "${body.start_date}"`;
      await execAsync(cmd);

      // Read output
      const docxBuffer = fs.readFileSync(outputPath);

      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      reply.header('Content-Disposition', `attachment; filename=Agenda_${body.start_date}.docx`);
      return reply.send(docxBuffer);
    } catch (error) {
      console.error("Export error:", error);
      return reply.code(500).send({ error: "Failed to generate DOCX" });
    } finally {
      // Cleanup
      if (fs.existsSync(eventsPath)) fs.unlinkSync(eventsPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
  });
}
