import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filenameServer = fileURLToPath(import.meta.url);
const __dirnameServer = path.dirname(__filenameServer);
const settingsFile = path.join(__dirnameServer, '../../../../server/.data/settings.json');

export default async function settingsRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    try {
      if (fs.existsSync(settingsFile)) {
        const data = fs.readFileSync(settingsFile, 'utf-8');
        return JSON.parse(data);
      }
      return { configured: false };
    } catch (e) {
      return { configured: false };
    }
  });

  app.post('/', async (request, reply) => {
    try {
      const body = request.body as any;
      fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
      fs.writeFileSync(settingsFile, JSON.stringify({ ...body, configured: true }, null, 2));
      return { success: true };
    } catch (e) {
      app.log.error(e);
      return reply.code(500).send({ error: 'Failed to save settings' });
    }
  });

  app.get('/diagnostics', async (request, reply) => {
    try {
      if (!fs.existsSync(settingsFile)) return { ok: false, error: 'No configurado' };
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      
      const inputFolderExists = fs.existsSync(settings.inputFolder);
      const rootFolderExists = fs.existsSync(settings.rootFolder);
      
      return {
        ok: inputFolderExists && rootFolderExists,
        inputFolderExists,
        rootFolderExists,
        expedientesCount: rootFolderExists ? fs.readdirSync(settings.rootFolder).length : 0
      };
    } catch (e) {
      return { ok: false, error: 'Error al comprobar configuración' };
    }
  });
}
