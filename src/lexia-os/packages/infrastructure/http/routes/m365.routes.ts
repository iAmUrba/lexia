import { FastifyInstance } from 'fastify';
import { PublicClientApplication, Configuration } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filenameServer = fileURLToPath(import.meta.url);
const __dirnameServer = path.dirname(__filenameServer);
const settingsFile = path.join(__dirnameServer, '../../../../../server/.data/settings.json');

// Este token vivirá solo en memoria del servidor Node durante el desarrollo.
let globalAccessToken: string | null = null;

export function getGlobalAccessToken() {
  return globalAccessToken;
}

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.LEXIA_GRAPH_CLIENT_ID || '04b07795-8ddb-461a-bbee-02f9e1bf7b46',
    authority: 'https://login.microsoftonline.com/common',
  }
};

const pca = new PublicClientApplication(msalConfig);

export default async function m365Routes(app: FastifyInstance) {
  
  app.get('/login', async (request, reply) => {
    // Si ya tenemos token, no hacemos login
    if (globalAccessToken) {
      return reply.send({ ok: true, message: 'Ya autenticado' });
    }

    try {
      const authCodeUrlParameters = {
        scopes: ["user.read", "files.read.all", "sites.read.all"],
        redirectUri: "http://localhost:3001/api/m365/redirect",
      };

      const response = await pca.getAuthCodeUrl(authCodeUrlParameters);
      return reply.send({ loginUrl: response });
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ error: 'No se pudo iniciar el flujo de autenticación' });
    }
  });

  app.get('/redirect', async (request, reply) => {
    const tokenRequest = {
      code: (request.query as any).code,
      scopes: ["user.read", "files.read.all", "sites.read.all"],
      redirectUri: "http://localhost:3001/api/m365/redirect",
    };

    try {
      const response = await pca.acquireTokenByCode(tokenRequest);
      globalAccessToken = response.accessToken;
      return reply.redirect('http://localhost:3000/glosador');
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ error: 'Error al obtener el token de Microsoft' });
    }
  });

  app.get('/diagnostic', async (request, reply) => {
    if (!globalAccessToken) {
      return reply.code(401).send({ error: 'No autenticado' });
    }

    const result = {
      steps: {
        authenticated: true,
        tokenObtained: true,
        oneDriveFound: false,
        readPermissions: false,
        writePermissions: false,
      },
      account: '',
      firstFolders: [] as string[],
      status: 'FALLIDO'
    };

    try {
      const client = Client.init({
        authProvider: (done) => done(null, globalAccessToken!)
      });

      const user = await client.api('/me').select('displayName,mail,userPrincipalName').get();
      result.account = user.mail || user.userPrincipalName;
      
      try {
        const driveRoot = await client.api('/me/drive/root').get();
        result.steps.oneDriveFound = true;
        
        const items = await client.api('/me/drive/root/children').top(10).get();
        result.steps.readPermissions = true;
        result.firstFolders = items.value.filter((i: any) => i.folder).map((i: any) => i.name);
        result.steps.writePermissions = true;
        result.status = 'LISTO PARA ANALIZAR';

      } catch (err: any) {
        if (err.code === 'ResourceNotFound') throw new Error('OneDrive no encontrado.');
        if (err.statusCode === 403) throw new Error('Permisos denegados (403).');
        throw err;
      }

      return reply.send(result);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message || 'Error en Graph API' });
    }
  });

  app.get('/folders', async (request, reply) => {
    if (!globalAccessToken) return reply.code(401).send({ error: 'No autenticado' });
    try {
      const client = Client.init({ authProvider: (done) => done(null, globalAccessToken!) });
      const items = await client.api('/me/drive/root/children').top(100).get();
      const folders = items.value
        .filter((i: any) => i.folder)
        .map((i: any) => ({ id: i.id, name: i.name, webUrl: i.webUrl }));
      return reply.send({ folders });
    } catch (e: any) {
      app.log.error(e);
      return reply.code(500).send({ error: e.message });
    }
  });

  app.post('/set-input-folder', async (request, reply) => {
    const { folderId, folderName } = request.body as any;
    if (!folderId) return reply.code(400).send({ error: 'folderId es requerido' });
    
    let currentSettings = {};
    if (fs.existsSync(settingsFile)) {
      currentSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    }
    
    currentSettings = { ...currentSettings, inputFolderId: folderId, inputFolderName: folderName };
    fs.writeFileSync(settingsFile, JSON.stringify(currentSettings, null, 2));
    
    return reply.send({ ok: true, message: `Carpeta ${folderName} guardada como entrada.` });
  });

  app.get('/logout', async (request, reply) => {
    globalAccessToken = null;
    return reply.send({ ok: true });
  });
}

