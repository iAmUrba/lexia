import fastify from "fastify";
import cors from "@fastify/cors";
import { tutelaRoutes } from "../infrastructure/http/routes/tutela.routes.js";
import agendaRoutes from "../infrastructure/http/routes/agenda.routes.js";
import { ResolverTutela } from "../application/ResolverTutela.js";
import { UIQueryService } from "../application/UIQueryService.js";
import { SimpleUnitOfWorkAdapter } from "../infrastructure/fake/SimpleUnitOfWorkAdapter.js";
import { InMemoryWorkRepositoryAdapter } from "../infrastructure/inmemory/InMemoryWorkRepositoryAdapter.js";
import { InMemoryDocumentRepositoryAdapter } from "../infrastructure/inmemory/InMemoryDocumentRepositoryAdapter.js";
import { InMemoryEventStoreAdapter } from "../infrastructure/inmemory/InMemoryEventStoreAdapter.js";
import { ApplicationRepositories } from "../application/ports/UnitOfWork.js";
import { ID } from "../shared/index.js";

const app = fastify({ logger: true });

// Setup fake db
const workRepo = new InMemoryWorkRepositoryAdapter();
const docRepo = new InMemoryDocumentRepositoryAdapter();
const eventStore = new InMemoryEventStoreAdapter();
const repos: ApplicationRepositories = {
  workRepository: workRepo,
  documentRepository: docRepo,
  eventStore: eventStore
};
const uow = new SimpleUnitOfWorkAdapter(repos);
const resolver = new ResolverTutela(uow);
const queryService = new UIQueryService(workRepo, docRepo, eventStore);

// Enable CORS for frontend
app.register(cors, { 
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

import fs from "fs";
import path from "path";

// No seed data

import fastifyMultipart from "@fastify/multipart";
import authRoutes from "../infrastructure/http/routes/auth.routes.js";
import aiRoutes from "../infrastructure/http/routes/ai.routes.js";

// Setup fastify multipart for file uploads
app.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

tutelaRoutes(app, resolver, queryService);
app.register(agendaRoutes, { prefix: "/api/agenda" });
app.register(authRoutes, { prefix: "/api/auth" });
aiRoutes(app);

import { fileURLToPath } from "url";
const __filenameServer = fileURLToPath(import.meta.url);
const __dirnameServer = path.dirname(__filenameServer);

app.get('/api/delitos', async (request, reply) => {
  const query = (request.query as any).q?.toLowerCase() || '';
  try {
    const dataPath = path.join(__dirnameServer, '.data', 'codigo_penal.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const delitos = JSON.parse(fileContent);
    
    if (!query) return delitos.slice(0, 10);
    
    const matches = delitos.filter((d: any) => 
      d.nombre.toLowerCase().includes(query) || 
      d.articulo.toLowerCase().includes(query)
    );
    
    return matches.slice(0, 15);
  } catch (err) {
    app.log.error(err);
    return [];
  }
});

app.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
