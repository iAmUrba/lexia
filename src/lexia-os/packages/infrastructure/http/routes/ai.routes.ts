import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Tesseract from "tesseract.js";
import { createRequire } from 'module';
if (typeof global !== "undefined") {
  (global as any).DOMMatrix = class DOMMatrix {};
  (global as any).ImageData = class ImageData {};
  (global as any).Path2D = class Path2D {};
}
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export default function aiRoutes(app: FastifyInstance) {
  app.post("/api/ocr/extract-reason", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await req.file();
      if (!data) {
        return reply.status(400).send({ error: "No file uploaded" });
      }

      const fileBuffer = await data.toBuffer();
      let extractedRawText = "";
      
      const mimeType = data.mimetype;
      
      // PASO 1: Los Ojos (Extracción Algorítmica)
      if (mimeType.startsWith('image/')) {
        // Usar Tesseract.js para imágenes
        const { data: { text } } = await Tesseract.recognize(fileBuffer, 'spa');
        extractedRawText = text;
      } else if (mimeType === 'application/pdf') {
        // Usar pdf-parse para PDFs
        const pdfData = await pdf(fileBuffer);
        extractedRawText = pdfData.text;
      } else {
        return reply.status(400).send({ error: "Tipo de archivo no soportado. Usa imagen o PDF." });
      }

      // PASO 2: El Cerebro Local (Ollama)
      const prompt = `Analiza el siguiente texto extraído de una excusa, correo o solicitud de aplazamiento de audiencia.
Extrae la siguiente información y devuélvela ÚNICAMENTE en formato JSON válido, sin texto adicional:
{
  "motivo": "el motivo del aplazamiento redactado en tercera persona para que encaje después de 'quien manifiesta a este despacho que...'",
  "fecha_solicitud": "la fecha exacta en que se hizo o envió la solicitud, en formato YYYY-MM-DD. Si no es clara, usa null",
  "quien_solicito": "Debe ser uno de estos exactos valores: 'la Fiscalía General de la Nación', 'la Defensa', 'el Despacho', 'el Procesado', 'el Representante de Víctimas', 'el Ministerio Público'. Si no estás seguro, usa null"
}

TEXTO EXTRAÍDO:
${extractedRawText}`;

      try {
        const ollamaRes = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "phi3",
            prompt: prompt,
            format: "json",
            stream: false
          })
        });

        if (!ollamaRes.ok) {
           return reply.status(200).send({ motivo: extractedRawText, fecha_solicitud: null, quien_solicito: null });
        }

        const ollamaData = await ollamaRes.json();
        let jsonRes;
        try {
          jsonRes = JSON.parse(ollamaData.response);
        } catch (e) {
          jsonRes = { motivo: ollamaData.response, fecha_solicitud: null, quien_solicito: null };
        }

        return reply.status(200).send({ 
          motivo: jsonRes.motivo || extractedRawText,
          fecha_solicitud: jsonRes.fecha_solicitud,
          quien_solicito: jsonRes.quien_solicito
        });
      } catch (ollamaErr) {
        // Si Ollama está apagado o falla, devolvemos el texto crudo algorítmico
        return reply.status(200).send({ reason: extractedRawText });
      }

    } catch (error: any) {
      app.log.error(error);
      return reply.status(500).send({ error: "Error processing the file", details: error.message });
    }
  });

  app.post("/api/ai/verify-document", async (req: FastifyRequest<{ Body: { htmlContent: string } }>, reply: FastifyReply) => {
    try {
      const body = req.body;
      if (!body || !body.htmlContent) {
        return reply.status(400).send({ error: "No htmlContent provided" });
      }

      const prompt = `Eres un Juez Penal de Circuito Especializado en Colombia, un verdadero crack del derecho que conoce todos los códigos de memoria y ha leído miles de actas y constancias. Tu labor como agente de jerarquía mayor es leer el siguiente borrador de documento legal en formato HTML, encontrar cualquier frase informal, incoherente o coloquial, y reescribirla con absoluta coherencia jurídica, formalidad y precisión. 

REGLAS ESTRICTAS:
1. No alteres las etiquetas HTML (div, img, strong, etc.), mantén exactamente la misma estructura.
2. Reescribe únicamente el texto que suene coloquial o informal para que tenga sentido dentro del contexto completo de la constancia (por ejemplo, ajustando justificaciones de aplazamiento).
3. Resuelve cualquier marcador de género como "el/la doctor(a)" analizando el nombre de la persona para usar "el doctor" o "la doctora" según corresponda.
4. No agregues saludos, explicaciones, ni bloques de código markdown (\`\`\`).
5. Devuelve ÚNICAMENTE el código HTML modificado y pulido.

BORRADOR ORIGINAL HTML:
${body.htmlContent}`;

      try {
        const ollamaRes = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "phi3",
            prompt: prompt,
            stream: false
          })
        });

        if (!ollamaRes.ok) {
           return reply.status(500).send({ error: "Error al comunicarse con la IA" });
        }

        const ollamaData = await ollamaRes.json();
        let verifiedHtml = ollamaData.response || "";
        
        // Limpiar bloques de markdown si la IA no obedece
        verifiedHtml = verifiedHtml.replace(/^```html\n?/i, "").replace(/^```\n?/i, "").replace(/```$/i, "");
        
        return reply.status(200).send({ verifiedHtml: verifiedHtml.trim() });
      } catch (ollamaErr: any) {
        app.log.error(ollamaErr);
        // Si falla Ollama, devolvemos el HTML original intacto para no bloquear al usuario
        return reply.status(200).send({ verifiedHtml: body.htmlContent });
      }
    } catch (error: any) {
      app.log.error(error);
      return reply.status(500).send({ error: "Server error", details: error.message });
    }
  });

  app.post("/api/ai/export-docx", async (req: FastifyRequest<{ Body: { paragraphs: any[] } }>, reply: FastifyReply) => {
    const { paragraphs } = req.body;
    if (!paragraphs || !Array.isArray(paragraphs)) {
      return reply.status(400).send({ error: "Missing or invalid paragraphs data" });
    }
    
    const serverDir = path.join(__dirname, "../../../server");
    const tmpDir = path.join(serverDir, "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const timestamp = Date.now();
    const dataPath = path.join(tmpDir, `doc_data_${timestamp}.json`);
    const outputPath = path.join(tmpDir, `doc_export_${timestamp}.docx`);
    const templatePath = path.join(serverDir, "templates", "membrete.docx");
    const scriptPath = path.join(serverDir, "export_document.py");

    fs.writeFileSync(dataPath, JSON.stringify(paragraphs, null, 2), "utf-8");

    try {
      const { exec } = await import("child_process");
      const util = await import("util");
      const execAsync = util.promisify(exec);

      // Ejecutar script en python
      const cmd = `python3 "${scriptPath}" --data "${dataPath}" --template "${templatePath}" --output "${outputPath}"`;
      await execAsync(cmd);

      // Leer salida
      const docxBuffer = fs.readFileSync(outputPath);

      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      reply.header('Content-Disposition', `attachment; filename=documento_${timestamp}.docx`);
      return reply.send(docxBuffer);
    } catch (error: any) {
      app.log.error(error);
      return reply.status(500).send({ error: "Failed to generate DOCX" });
    } finally {
      // Limpieza
      if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
  });
}
