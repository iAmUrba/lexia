import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ResolverTutela } from "../../../application/ResolverTutela.js";
import { UIQueryService } from "../../../application/UIQueryService.js";
import { CreateTutelaRequest } from "../dto/CreateTutelaRequest.js";
import { CreateTutelaResponse } from "../dto/CreateTutelaResponse.js";
import { mapErrorToHttpCode } from "../errors/httpErrorMapper.js";
import { ID } from "../../../shared/index.js";

export function tutelaRoutes(app: FastifyInstance, resolver: ResolverTutela, queryService?: UIQueryService) {
  app.post("/api/tutelas", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as CreateTutelaRequest;
    if (!body || !body.eventId || !body.radicado || !body.procesados || !body.procesados.length || !body.fiscal?.nombre || !body.fiscal?.despacho || !body.fiscal?.seccional || !body.ministerio_publico?.nombre || !body.ministerio_publico?.despacho || !body.delitos || !body.delitos.length) {
      return reply.status(400).send({ message: "Bad Request: Missing required fields (radicado, procesados, delitos, fiscal, ministerio_publico)" });
    }

    const eventId = new ID(body.eventId);
    
    // El titulo por defecto o descripcion
    const firstProcesadoName = body.procesados[0].nombre;
    const procesadosText = body.procesados.length > 1 ? `${firstProcesadoName} y otros` : firstProcesadoName;
    const demandanteText = body.demandante ? ` / ${body.demandante}` : "";
    const desc = body.description || `Exp. ${body.radicado} - ${procesadosText}${demandanteText}`;

    const metadata = {
      radicado: body.radicado,
      procesados: body.procesados,
      delitos: body.delitos,
      demandante: body.demandante,
      fiscal: body.fiscal,
      seccional: body.seccional,
      ministerio_publico: body.ministerio_publico,
      victimas: body.victimas || "",
      representante_victimas: body.representante_victimas || ""
    };

    const result = await resolver.iniciarTrabajo(
      eventId,
      desc,
      req.headers['x-lexia-despacho'] as string || 'default',
      metadata
    );
    if (!result.ok) {
      const { status, message } = mapErrorToHttpCode(result.error);
      return reply.status(status).send({ message });
    }

    const trabajo = result.value!;
    
    // Cumpliendo ADR 005: Mapping explícito
    const responseDto: CreateTutelaResponse = {
      workId: trabajo.id.value,
      state: trabajo.state as string,
      description: trabajo.description
    };

    return reply.status(201).send(responseDto);
  });

  if (queryService) {
    app.get("/api/tutelas", async (req: FastifyRequest, reply: FastifyReply) => {
      const rol = req.headers['x-lexia-rol'] as string;
      const despachoId = req.headers['x-lexia-despacho'] as string;
      const list = await queryService.listExpedientes(rol, despachoId);
      return reply.send(list);
    });

    app.get("/api/tutelas/:id", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const rol = req.headers['x-lexia-rol'] as string;
      const despachoId = req.headers['x-lexia-despacho'] as string;
      const exp = await queryService.getExpediente(req.params.id, rol, despachoId);
      if (!exp) return reply.status(404).send({ message: "Not Found" });
      return reply.send(exp);
    });

    app.put("/api/tutelas/:id/metadata", async (req: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
      const body = req.body;
      if (!body) return reply.status(400).send({ message: "Missing body" });
      
      const trabajoId = new ID(req.params.id);
      // Construct desc
      const firstProcesadoName = body.procesados?.[0]?.nombre;
      let desc = undefined;
      if (firstProcesadoName) {
        const procesadosText = body.procesados.length > 1 ? `${firstProcesadoName} y otros` : firstProcesadoName;
        const demandanteText = body.demandante ? ` / ${body.demandante}` : "";
        desc = `Exp. ${body.radicado} - ${procesadosText}${demandanteText}`;
      }

      const result = await resolver.actualizarTrabajo(trabajoId, body, desc);
      if (!result.ok) {
        const { status, message } = mapErrorToHttpCode(result.error);
        return reply.status(status).send({ message });
      }

      return reply.status(200).send({ message: "Metadata updated successfully" });
    });

    app.post("/api/tutelas/:id/documentos", async (req: FastifyRequest<{ Params: { id: string }, Body: { title: string, content: any } }>, reply: FastifyReply) => {
      const exp = await queryService.getExpediente(req.params.id);
      if (!exp) return reply.status(404).send({ message: "Expediente Not Found" });
      
      const title = req.body?.title;
      const content = req.body?.content;
      if (!title || !content) return reply.status(400).send({ message: "Missing title or content" });

      const trabajoId = new ID(req.params.id);
      const currentWork = Array.from((queryService as any).workRepo.map.values()).find((w: any) => w.id.value === trabajoId.value) as any;
      if (!currentWork) return reply.status(404).send({ message: "Work Not Found" });

      const result = await resolver.crearDocumentoBorrador(trabajoId, currentWork.version, title, content);
      if (!result.ok) {
        const { status, message } = mapErrorToHttpCode(result.error);
        return reply.status(status).send({ message });
      }
      return reply.status(201).send({ message: "Documento creado", docId: result.value!.id.value });
    });

    app.delete("/api/tutelas/:workId/documentos/:docId", async (req: FastifyRequest<{ Params: { workId: string, docId: string } }>, reply: FastifyReply) => {
      const result = await resolver.eliminarDocumento(new ID(req.params.docId));
      if (!result.ok) {
        const { status, message } = mapErrorToHttpCode(result.error);
        return reply.status(status).send({ message });
      }
      return reply.send({ message: "Documento eliminado" });
    });

    app.post("/api/tutelas/:id/documentos/:docId/guardar", async (req: FastifyRequest<{ Params: { id: string, docId: string }, Body: { content: any } }>, reply: FastifyReply) => {
      const content = req.body?.content;
      if (!content) return reply.status(400).send({ message: "Missing content" });

      const docId = new ID(req.params.docId);
      
      // La versión deberia venir de la UI, usamos simplificacion:
      const currentDoc = Array.from((queryService as any).docRepo.map.values()).find((d: any) => d.id.value === docId.value) as any;
      if (!currentDoc) return reply.status(404).send({ message: "Document Not Found" });

      const result = await resolver.proyectarFallo(docId, currentDoc.version, content);
      if (!result.ok) {
        const { status, message } = mapErrorToHttpCode(result.error);
        return reply.status(status).send({ message });
      }
      return reply.status(200).send({ message: "Guardado exitosamente", docId: result.value!.id.value });
    });

    app.post("/api/tutelas/:id/firmar", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const exp = await queryService.getExpediente(req.params.id);
      if (!exp || !exp.document) return reply.status(404).send({ message: "Document Not Found" });
      
      const docId = new ID(exp.document.id);
      // Asumimos que la UI conoce la version actual, por simplificación usamos la que está en BD (pero en realidad UI debe mandarla)
      const currentDoc = Array.from((queryService as any).docRepo.map.values()).find((d: any) => d.id.value === docId.value) as any;
      
      const result = await resolver.firmarFallo(docId, currentDoc.version);
      if (!result.ok) {
        const { status, message } = mapErrorToHttpCode(result.error);
        return reply.status(status).send({ message });
      }
      return reply.status(200).send({ message: "Firmado exitosamente" });
    });
  }
}
