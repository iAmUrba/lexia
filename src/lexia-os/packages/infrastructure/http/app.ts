import fastify, { FastifyInstance } from "fastify";
import { tutelaRoutes } from "./routes/tutela.routes.js";
import { ResolverTutela } from "../../application/ResolverTutela.js";

export function buildApp(resolver: ResolverTutela): FastifyInstance {
  const app = fastify();
  
  // Registrar rutas
  tutelaRoutes(app, resolver);

  return app;
}
