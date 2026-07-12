import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_PATH = path.join(__dirname, "../../../server/users.json");

export default async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, password } = request.body as any;
    
    if (!username || !password) {
      return reply.code(400).send({ error: "Faltan credenciales" });
    }

    try {
      const data = fs.readFileSync(USERS_PATH, "utf-8");
      const users = JSON.parse(data);
      
      const user = users.find((u: any) => u.username === username && u.password === password);
      
      if (!user) {
        return reply.code(401).send({ error: "Credenciales inválidas" });
      }
      
      // Devolver los datos del usuario sin el password
      const { password: _, ...safeUser } = user;
      
      return reply.send({ success: true, user: safeUser });
    } catch (error) {
      console.error("Error leyendo users.json", error);
      return reply.code(500).send({ error: "Error interno del servidor" });
    }
  });
}
