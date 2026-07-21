import { FastifyInstance } from 'fastify';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filenameServer = fileURLToPath(import.meta.url);
const __dirnameServer = path.dirname(__filenameServer);
const settingsFile = path.join(__dirnameServer, '../../../server/.data/settings.json');
const authFile = path.join(__dirnameServer, '../../../server/.data/.auth_state.json');
const browserStateFile = path.join(__dirnameServer, '../../../server/.data/browser_state.json');

export interface SPAuthTokens {
  accessToken: string;
}

// Cargamos el token desde el archivo al iniciar si existe
let globalAuthTokens: SPAuthTokens | null = null;
if (fs.existsSync(authFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    globalAuthTokens = { accessToken: data.accessToken || data.token };
  } catch (e) {
    console.error('Error leyendo .auth_state.json', e);
  }
}

export function getGlobalAuthTokens() { return globalAuthTokens; }
export function getSharePointHeaders() {
  if (!globalAuthTokens) return {};
  return { 'Authorization': `Bearer ${globalAuthTokens.accessToken}`, 'Accept': 'application/json' };
}

async function silentTokenRefresh(app: FastifyInstance): Promise<boolean> {
  if (!fs.existsSync(browserStateFile)) return false;
  
  app.log.info('Intentando refrescar token silenciosamente con Playwright...');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: browserStateFile });
    const page = await context.newPage();
    
    let tokensExtracted = false;
    page.on('request', request => {
      if (tokensExtracted) return;
      const auth = request.headers()['authorization'];
      if (auth && auth.toLowerCase().startsWith('bearer ')) {
        const token = auth.substring(7);
        if (request.url().includes('graph.microsoft.com')) {
          globalAuthTokens = { accessToken: token };
          fs.writeFileSync(authFile, JSON.stringify(globalAuthTokens, null, 2));
          tokensExtracted = true;
        }
      }
    });

    await page.goto('https://etbcsj-my.sharepoint.com/');
    
    for (let i = 0; i < 15; i++) {
      if (tokensExtracted) break;
      await new Promise(r => setTimeout(r, 1000));
    }
    
    if (tokensExtracted) {
      const newState = await context.storageState();
      fs.writeFileSync(browserStateFile, JSON.stringify(newState, null, 2));
      app.log.info('Silent Refresh exitoso.');
    }
    
    await browser.close();
    return tokensExtracted;
  } catch (e) {
    if (browser) await browser.close();
    app.log.error('Fallo en silentTokenRefresh: ' + (e as any).message);
    return false;
  }
}

async function withRetry<T>(app: FastifyInstance, reply: any, operation: () => Promise<T>): Promise<T | void> {
  try {
    return await operation();
  } catch (e: any) {
    const isAuthError = e.message?.includes('401') || e.status === 401 || e.message?.includes('403');
    if (isAuthError) {
      app.log.warn('Error de autenticación detectado. Intentando Silent Refresh...');
      const success = await silentTokenRefresh(app);
      if (success) {
        app.log.info('Reintentando operación tras refresh exitoso...');
        try {
          return await operation();
        } catch (retryErr: any) {
           app.log.error(retryErr);
           return reply.code(retryErr.status || 500).send({ error: retryErr.message || 'Error en reintento' });
        }
      } else {
        globalAuthTokens = null;
        if (fs.existsSync(authFile)) fs.unlinkSync(authFile);
        return reply.code(401).send({ error: 'Token expirado y no se pudo renovar silenciosamente' });
      }
    }
    app.log.error(e);
    return reply.code(500).send({ error: e.message || 'Error desconocido' });
  }
}

export default async function m365Routes(app: FastifyInstance) {
  
  app.get('/login', async (request, reply) => {
    if (globalAuthTokens) return reply.send({ loginUrl: '/glosador' });

    // Intento silencioso primero
    if (fs.existsSync(browserStateFile)) {
      const success = await silentTokenRefresh(app);
      if (success) return reply.send({ loginUrl: '/glosador' });
    }

    try {
      const browser = await chromium.launch({ headless: false });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto('https://etbcsj-my.sharepoint.com/');
      let tokensExtracted = false;
      
      page.on('request', request => {
        if (tokensExtracted) return;
        const auth = request.headers()['authorization'];
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
          const token = auth.substring(7);
          if (request.url().includes('graph.microsoft.com')) {
            globalAuthTokens = { accessToken: token };
            fs.writeFileSync(authFile, JSON.stringify(globalAuthTokens, null, 2));
            tokensExtracted = true;
          }
        }
      });
      
      for (let i = 0; i < 180; i++) {
        if (tokensExtracted) break;
        await new Promise(r => setTimeout(r, 1000));
      }
      
      if (tokensExtracted) {
        const state = await context.storageState();
        fs.writeFileSync(browserStateFile, JSON.stringify(state, null, 2));
      }
      
      await browser.close();
      if (!tokensExtracted) return reply.code(408).send({ error: 'Tiempo agotado' });
      return reply.send({ loginUrl: '/glosador' });
    } catch (error: any) {
      app.log.error(error);
      return reply.code(500).send({ error: 'Error en Playwright' });
    }
  });

  app.get('/redirect', async (request, reply) => {
    return reply.redirect('http://localhost:3000/glosador');
  });

  app.get('/diagnostic', async (request, reply) => {
    return withRetry(app, reply, async () => {
      if (!globalAuthTokens) throw new Error('401 No autenticado');

      const result = {
        steps: { authenticated: true, tokenObtained: true, oneDriveFound: false, readPermissions: false, writePermissions: false },
        account: 'Usuario SharePoint', firstFolders: [] as string[], status: 'FALLIDO'
      };

      const driveRes = await fetch('https://graph.microsoft.com/v1.0/me/drive/root', { headers: getSharePointHeaders() });
      if (!driveRes.ok) {
        if (driveRes.status === 401) throw new Error('401');
        throw new Error(`Error API: ${driveRes.status}`);
      }
      result.steps.oneDriveFound = true;
      
      const itemsRes = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children?$top=10', { headers: getSharePointHeaders() });
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        result.steps.readPermissions = true;
        result.firstFolders = itemsData.value.filter((i: any) => i.folder).map((i: any) => i.name);
        result.steps.writePermissions = true;
        result.status = 'LISTO PARA ANALIZAR (MODO COOKIES)';
      }
      return reply.send(result);
    });
  });

  app.get('/folders', async (request, reply) => {
    return withRetry(app, reply, async () => {
      if (!globalAuthTokens) throw new Error('401 No autenticado');
      const itemsRes = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children?$top=100', { headers: getSharePointHeaders() });
      if (itemsRes.status === 401) throw new Error('401');
      if (!itemsRes.ok) throw new Error('Error listando carpetas');
      
      const itemsData = await itemsRes.json();
      const folders = itemsData.value.filter((i: any) => i.folder).map((i: any) => ({ id: i.id, name: i.name, webUrl: i.webUrl }));
      return reply.send({ folders });
    });
  });

  app.post('/set-input-folder', async (request, reply) => {
    const { folderId, folderName } = request.body as any;
    if (!folderId) return reply.code(400).send({ error: 'folderId es requerido' });
    let currentSettings = {};
    if (fs.existsSync(settingsFile)) currentSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    currentSettings = { ...currentSettings, inputFolderId: folderId, inputFolderName: folderName };
    fs.writeFileSync(settingsFile, JSON.stringify(currentSettings, null, 2));
    return reply.send({ ok: true, message: `Carpeta ${folderName} guardada como entrada.` });
  });

  app.get('/inbox', async (request, reply) => {
    return withRetry(app, reply, async () => {
      if (!globalAuthTokens) throw new Error('401 No autenticado');
      let currentSettings: any = {};
      if (fs.existsSync(settingsFile)) currentSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      const folderId = currentSettings.inputFolderId;
      if (!folderId) return reply.send({ files: [], folderName: null });

      const itemsRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`, { headers: getSharePointHeaders() });
      if (itemsRes.status === 401) throw new Error('401');
      if (!itemsRes.ok) throw new Error('Error leyendo bandeja');
      
      const itemsData = await itemsRes.json();
      const allFiles: any[] = [];
      const addFile = (i: any, parentName?: string) => {
        if (i.file && i.name.toLowerCase().endsWith('.pdf')) {
          allFiles.push({ id: i.id, name: i.name, size: i.size, lastModifiedDateTime: i.lastModifiedDateTime, webUrl: i.webUrl, folderPath: parentName || '' });
        }
      };

      for (const item of itemsData.value) {
        addFile(item);
        if (item.folder) {
          try {
            const subItemsRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${item.id}/children`, { headers: getSharePointHeaders() });
            if (subItemsRes.ok) {
              const subItemsData = await subItemsRes.json();
              for (const subItem of subItemsData.value) addFile(subItem, item.name);
            }
          } catch (e) {}
        }
      }
      allFiles.sort((a, b) => new Date(a.lastModifiedDateTime).getTime() - new Date(b.lastModifiedDateTime).getTime());
      return reply.send({ files: allFiles, folderName: currentSettings.inputFolderName });
    });
  });

  app.post('/process-file', async (request, reply) => {
    return withRetry(app, reply, async () => {
      if (!globalAuthTokens) throw new Error('401 No autenticado');
      const { fileId, fileName } = request.body as any;
      if (!fileId) return reply.code(400).send({ error: 'fileId es requerido' });

      const { GraphClient } = await import('../../graph/impl/GraphClient.js');
      const { GraphOneDriveFileSystem } = await import('../../graph/impl/GraphOneDriveFileSystem.js');
      const { PdfTextExtractor } = await import('../../../domain/glosador/EvidenceSystem/PdfTextExtractor.js');
      const { EvidenceExtractor } = await import('../../../domain/glosador/EvidenceSystem/EvidenceExtractor.js');
      const { ExpedienteRepository } = await import('../../../domain/glosador/EvidenceSystem/ExpedienteRepository.js');
      const { EvidenceScorer } = await import('../../../domain/glosador/EvidenceSystem/Scoring/EvidenceScorer.js');
      const { ReviewSession } = await import('../../../domain/glosador/ApprovalWorkflow/ReviewSession.js');

      const config = { environment: 'SANDBOX', tenantId: 'temp', clientId: 'temp', baseUrl: 'https://graph.microsoft.com', apiVersion: 'v1.0' };
      const authProvider = { getAccessToken: async () => globalAuthTokens!.accessToken, invalidateToken: () => {} };
      const transport = {
          request: async (method: string, url: string, options: any) => {
              const response = await fetch(url, { method, headers: options.headers, body: options.body ? JSON.stringify(options.body) : undefined });
              if (response.status === 401) throw new Error('401');
              const isJson = response.headers.get('content-type')?.includes('application/json');
              const data = isJson ? await response.json() : await response.text();
              return { status: response.status, headers: response.headers, data };
          }
      };
      
      const graphClient = new GraphClient(config as any, authProvider as any, transport as any);
      const meResponse = await graphClient.get<any>('/me/drive');
      const fsGraph = new GraphOneDriveFileSystem(graphClient, meResponse.id);

      const downloadRes = await graphClient.get<any>(`/me/drive/items/${fileId}`);
      const downloadUrl = downloadRes['@microsoft.graph.downloadUrl'];
      if (!downloadUrl) throw new Error('No URL de descarga');
      
      const fileStream = await fetch(downloadUrl);
      const arrayBuffer = await fileStream.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const pdfExtractor = new PdfTextExtractor();
      const text = await pdfExtractor.extractText(buffer);
      const evidenceExtractor = new EvidenceExtractor();
      const evidence = evidenceExtractor.extract(text);

      const repository = new ExpedienteRepository(fsGraph);
      const scorer = new EvidenceScorer();
      const resolver = new (await import('../../../domain/glosador/EvidenceSystem/EvidenceResolver.js')).EvidenceResolver(repository, scorer);
      
      const startTime = performance.now();
      const report = await resolver.resolve(evidence);
      const duration = Math.round(performance.now() - startTime);

      const investigationReport = { documentId: fileId, engineVersion: '1.0', startedAt: new Date(startTime).toISOString(), finishedAt: new Date().toISOString(), extractorEvidence: evidence, resolverResult: report };
      const propuesta = { engineVersion: '1.0', evidenceVersion: '1.0', indiceVersion: '1.0', expedienteId: report.expedienteId || 'unknown', consecutivo: 1, investigationReportSnapshot: investigationReport };
      const session = new ReviewSession(fileId, 'user_123', propuesta);
      const proposedDecision = session.approve();

      return reply.send({
        textExtractedLength: text.length, textPreview: text.substring(0, 200).replace(/\n/g, ' '),
        evidence: { radicados: evidence.radicados.map((r: any) => r.valor), procesados: evidence.procesados.map((p: any) => p.valor), spoa: evidence.spoa.map((s: any) => s.valor) },
        report: { estado: report.estado, expedienteId: report.expedienteId, rutaExpediente: report.rutaExpediente },
        proposedDecision, durationMs: duration
      });
    });
  });

  app.post('/approve-decision', async (request, reply) => {
    return withRetry(app, reply, async () => {
      if (!globalAuthTokens) throw new Error('401 No autenticado');
      const decisionEvent = request.body as any;
      if (!decisionEvent || !decisionEvent.eventId) return reply.code(400).send({ error: 'decisionEvent es requerido' });

      const { SqliteDecisionRepository } = await import('../../../domain/glosador/ApprovalWorkflow/DecisionRepository.js');
      const { ExecutionPlanBuilder } = await import('../../../domain/glosador/ExecutionSystem/ExecutionPlanBuilder.js');
      const { PreflightValidator } = await import('../../../domain/glosador/ExecutionSystem/PreflightValidator.js');
      const { DryRunExecutor } = await import('../../../domain/glosador/ExecutionSystem/DryRunExecutor.js');
      const { GraphClient } = await import('../../graph/impl/GraphClient.js');
      const { GraphOneDriveFileSystem } = await import('../../graph/impl/GraphOneDriveFileSystem.js');
      const { DatabaseManager } = await import('../../sqlite/DatabaseManager.js');

      const dbManager = DatabaseManager.getInstance();
      try { dbManager.connect(); } catch (e) {}

      const decisionRepo = new SqliteDecisionRepository();
      await decisionRepo.appendEvent(decisionEvent);

      const plan = ExecutionPlanBuilder.buildFromDecision(decisionEvent);

      const config = { environment: 'SANDBOX', tenantId: 'temp', clientId: 'temp', baseUrl: 'https://graph.microsoft.com', apiVersion: 'v1.0' };
      const authProvider = { getAccessToken: async () => globalAuthTokens!.accessToken, invalidateToken: () => {} };
      const transport = {
          request: async (method: string, url: string, options: any) => {
              const response = await fetch(url, { method, headers: options.headers, body: options.body ? JSON.stringify(options.body) : undefined });
              if (response.status === 401) throw new Error('401');
              const isJson = response.headers.get('content-type')?.includes('application/json');
              const data = isJson ? await response.json() : await response.text();
              return { status: response.status, headers: response.headers, data };
          }
      };
      
      const graphClient = new GraphClient(config as any, authProvider as any, transport as any);
      const meResponse = await graphClient.get<any>('/me/drive');
      const fsGraph = new GraphOneDriveFileSystem(graphClient, meResponse.id);

      class MockLockManager { async isLocked(id: string) { return false; } }
      const preflight = new PreflightValidator(fsGraph, new MockLockManager());
      const preflightReport = await preflight.validate(plan, decisionEvent.payload.decision.expedienteId, '/expediente/00_IndiceElectronico.xlsx', 'mock');
      const dryRun = new DryRunExecutor();
      const dryRunReport = await dryRun.execute(plan, preflightReport);

      return reply.send({ success: true, planHash: plan.planHash, dryRunReport });
    });
  });

  app.get('/logout', async (request, reply) => {
    globalAuthTokens = null;
    if (fs.existsSync(authFile)) fs.unlinkSync(authFile);
    if (fs.existsSync(browserStateFile)) fs.unlinkSync(browserStateFile);
    return reply.send({ ok: true });
  });
}
