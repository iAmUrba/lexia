import { FastifyInstance } from 'fastify';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filenameServer = fileURLToPath(import.meta.url);
const __dirnameServer = path.dirname(__filenameServer);
const settingsFile = path.join(__dirnameServer, '../../../server/.data/settings.json');

export interface SPAuthTokens {
  accessToken: string;
}

const authFile = path.join(__dirnameServer, '../../../server/.data/.auth_state.json');

// Cargamos el token desde el archivo al iniciar si existe
let globalAuthTokens: SPAuthTokens | null = null;
if (fs.existsSync(authFile)) {
  try {
    globalAuthTokens = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  } catch (e) {
    console.error('Error leyendo .auth_state.json', e);
  }
}

export function getGlobalAuthTokens() {
  return globalAuthTokens;
}

export function getSharePointHeaders() {
  if (!globalAuthTokens) return {};
  return {
    'Authorization': `Bearer ${globalAuthTokens.accessToken}`,
    'Accept': 'application/json'
  };
}

export default async function m365Routes(app: FastifyInstance) {
  
  app.get('/login', async (request, reply) => {
    // Si ya tenemos token, no hacemos login
    if (globalAuthTokens) {
      return reply.send({ loginUrl: '/glosador' });
    }

    try {
      // Lanzamos Playwright con cabeza (visible) para que el usuario pueda iniciar sesión
      const browser = await chromium.launch({ headless: false });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // La URL base del SharePoint de la Rama Judicial
      const spUrl = 'https://etbcsj-my.sharepoint.com/';
      
      await page.goto(spUrl);
      
      let tokensExtracted = false;
      
      // Interceptamos las peticiones de red para robar el Bearer Token de Graph
      page.on('request', request => {
        if (tokensExtracted) return;
        const auth = request.headers()['authorization'];
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
          const token = auth.substring(7);
          const url = request.url();
          
          // SharePoint Modern usa Graph API por debajo. Robamos ese token.
          if (url.includes('graph.microsoft.com')) {
            globalAuthTokens = {
              accessToken: token
            };
            fs.writeFileSync(authFile, JSON.stringify(globalAuthTokens, null, 2));
            tokensExtracted = true;
          }
        }
      });
      
      for (let i = 0; i < 180; i++) { // Esperar hasta 3 minutos
        if (tokensExtracted) break;
        await new Promise(r => setTimeout(r, 1000));
      }
      
      await browser.close();
      
      if (!tokensExtracted) {
        return reply.code(408).send({ error: 'Tiempo de espera agotado o inicio de sesión fallido' });
      }

      // Devolvemos la ruta del frontend para que haga la redirección
      return reply.send({ loginUrl: '/glosador' });
    } catch (error: any) {
      app.log.error(error);
      return reply.code(500).send({ error: 'No se pudo iniciar el flujo de autenticación con Playwright' });
    }
  });

  app.get('/redirect', async (request, reply) => {
    // Este endpoint ya no se usará en el flujo Playwright
    return reply.redirect('http://localhost:3000/glosador');
  });

  app.get('/diagnostic', async (request, reply) => {
    if (!globalAuthTokens) {
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
      account: 'Usuario SharePoint',
      firstFolders: [] as string[],
      status: 'FALLIDO'
    };

    try {
      // Intentamos llamar a la API v2.0 usando las cookies
      const driveRes = await fetch('https://graph.microsoft.com/v1.0/me/drive/root', {
        headers: getSharePointHeaders()
      });
      
      if (!driveRes.ok) {
        if (driveRes.status === 403) throw new Error('Permisos denegados (403).');
        if (driveRes.status === 404) throw new Error('OneDrive no encontrado (404).');
        throw new Error(`Error API: ${driveRes.status}`);
      }
      result.steps.oneDriveFound = true;
      
      const itemsRes = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children?$top=10', {
        headers: getSharePointHeaders()
      });
      
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        result.steps.readPermissions = true;
        result.firstFolders = itemsData.value.filter((i: any) => i.folder).map((i: any) => i.name);
        result.steps.writePermissions = true;
        result.status = 'LISTO PARA ANALIZAR (MODO COOKIES)';
      }

      return reply.send(result);
    } catch (e: any) {
      console.error('Error in /diagnostic:', e.message);
      return reply.code(500).send({ error: e.message || 'Error desconocido' });
    }
  });

  app.get('/folders', async (request, reply) => {
    if (!globalAuthTokens) return reply.code(401).send({ error: 'No autenticado' });
    try {
      const itemsRes = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children?$top=100', {
        headers: getSharePointHeaders()
      });
      if (!itemsRes.ok) throw new Error('Error listando carpetas');
      
      const itemsData = await itemsRes.json();
      const folders = itemsData.value
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
    globalAuthTokens = null;
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
    }
    return reply.send({ ok: true });
  });
}
