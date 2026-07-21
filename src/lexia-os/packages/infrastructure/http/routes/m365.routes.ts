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
    const data = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    globalAuthTokens = {
        accessToken: data.accessToken || data.token
    };
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
      if (e.message && e.message.includes('401')) {
        globalAuthTokens = null;
        if (fs.existsSync(authFile)) {
          try { fs.unlinkSync(authFile); } catch (err) {}
        }
        return reply.code(401).send({ error: 'Token expirado' });
      }
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

  app.get('/inbox', async (request, reply) => {
    if (!globalAuthTokens) return reply.code(401).send({ error: 'No autenticado' });
    
    let currentSettings: any = {};
    if (fs.existsSync(settingsFile)) {
      currentSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    }
    
    const folderId = currentSettings.inputFolderId;
    if (!folderId) return reply.send({ files: [], folderName: null });

    try {
      const itemsRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`, {
        headers: getSharePointHeaders()
      });
      if (!itemsRes.ok) throw new Error('Error leyendo bandeja de entrada');
      
      const itemsData = await itemsRes.json();
      const allFiles: any[] = [];
      
      // Función auxiliar para agregar archivos
      const addFile = (i: any, parentName?: string) => {
        if (i.file && i.name.toLowerCase().endsWith('.pdf')) {
          allFiles.push({
            id: i.id,
            name: i.name,
            size: i.size,
            lastModifiedDateTime: i.lastModifiedDateTime,
            webUrl: i.webUrl,
            folderPath: parentName || '' // Guardamos en qué carpeta estaba
          });
        }
      };

      // Recorremos los items de la raíz (e.g. JUAN DAVID)
      for (const item of itemsData.value) {
        addFile(item); // Si es un archivo directo, lo agregamos
        
        // Si es una carpeta (ej. fecha del día), entramos a buscar sus PDFs (1 nivel de profundidad)
        if (item.folder) {
          try {
            const subItemsRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${item.id}/children`, {
              headers: getSharePointHeaders()
            });
            if (subItemsRes.ok) {
              const subItemsData = await subItemsRes.json();
              for (const subItem of subItemsData.value) {
                addFile(subItem, item.name);
              }
            }
          } catch (e) {
            console.error(`Error leyendo subcarpeta ${item.name}`, e);
          }
        }
      }
        
      // Ordenar por fecha de llegada (más antiguos primero, simulando una cola FIFO)
      allFiles.sort((a, b) => new Date(a.lastModifiedDateTime).getTime() - new Date(b.lastModifiedDateTime).getTime());
        
      return reply.send({ files: allFiles, folderName: currentSettings.inputFolderName });
    } catch (e: any) {
      app.log.error(e);
      return reply.code(500).send({ error: e.message });
    }
  });

  app.post('/process-file', async (request, reply) => {
    if (!globalAuthTokens) return reply.code(401).send({ error: 'No autenticado' });
    const { fileId, fileName } = request.body as { fileId: string, fileName: string };
    
    if (!fileId) return reply.code(400).send({ error: 'fileId es requerido' });

    try {
      // Dynamic imports to avoid issues if run context differs
      const { GraphClient } = await import('../../graph/impl/GraphClient.js');
      const { GraphOneDriveFileSystem } = await import('../../graph/impl/GraphOneDriveFileSystem.js');
      const { PdfTextExtractor } = await import('../../../domain/glosador/EvidenceSystem/PdfTextExtractor.js');
      const { EvidenceExtractor } = await import('../../../domain/glosador/EvidenceSystem/EvidenceExtractor.js');
      const { ExpedienteRepository } = await import('../../../domain/glosador/EvidenceSystem/ExpedienteRepository.js');
      const { EvidenceScorer } = await import('../../../domain/glosador/EvidenceSystem/Scoring/EvidenceScorer.js');
      const { ReviewSession } = await import('../../../domain/glosador/ApprovalWorkflow/ReviewSession.js');
      const { SqliteDecisionRepository } = await import('../../../domain/glosador/ApprovalWorkflow/DecisionRepository.js');
      const { ExecutionPlanBuilder } = await import('../../../domain/glosador/ExecutionSystem/ExecutionPlanBuilder.js');
      const { PreflightValidator } = await import('../../../domain/glosador/ExecutionSystem/PreflightValidator.js');
      const { DryRunExecutor } = await import('../../../domain/glosador/ExecutionSystem/DryRunExecutor.js');
      const { DatabaseManager } = await import('../../sqlite/DatabaseManager.js');

      const config = { environment: 'SANDBOX', tenantId: 'temp', clientId: 'temp', baseUrl: 'https://graph.microsoft.com', apiVersion: 'v1.0' };
      const authProvider = { getAccessToken: async () => globalAuthTokens!.accessToken, invalidateToken: () => {} };
      const transport = {
          request: async (method: string, url: string, options: any) => {
              const response = await fetch(url, { method, headers: options.headers, body: options.body ? JSON.stringify(options.body) : undefined });
              const isJson = response.headers.get('content-type')?.includes('application/json');
              const data = isJson ? await response.json() : await response.text();
              return { status: response.status, headers: response.headers, data };
          }
      };
      
      const graphClient = new GraphClient(config as any, authProvider as any, transport as any);
      const meResponse = await graphClient.get<any>('/me/drive');
      const fsGraph = new GraphOneDriveFileSystem(graphClient, meResponse.id);

      // Download file using exact ID path instead of filename path since we already have the ID
      // To keep it simple with existing methods, GraphOneDriveFileSystem's read expects path. 
      // We can fetch directly using the graphClient here:
      const downloadRes = await graphClient.get<any>(`/me/drive/items/${fileId}`);
      const downloadUrl = downloadRes['@microsoft.graph.downloadUrl'];
      if (!downloadUrl) throw new Error('No se pudo obtener URL de descarga para el archivo');
      
      const fileStream = await fetch(downloadUrl);
      const arrayBuffer = await fileStream.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const pdfExtractor = new PdfTextExtractor();
      const text = await pdfExtractor.extractText(buffer);
      
      const evidenceExtractor = new EvidenceExtractor();
      const evidence = evidenceExtractor.extract(text);

      const repository = new ExpedienteRepository(fsGraph);
      const scorer = new EvidenceScorer();
      const resolver = new EvidenceResolver(repository, scorer);
      
      const startTime = performance.now();
      const report = await resolver.resolve(evidence);
      const duration = Math.round(performance.now() - startTime);

      // Create Proposal
      const investigationReport = {
          documentId: fileId,
          engineVersion: '1.0',
          startedAt: new Date(startTime).toISOString(),
          finishedAt: new Date().toISOString(),
          extractorEvidence: evidence,
          resolverResult: report
      };
      const propuesta = {
          engineVersion: '1.0',
          evidenceVersion: '1.0',
          indiceVersion: '1.0',
          expedienteId: report.expedienteId || 'unknown',
          consecutivo: 1, // Dummy consecutivo
          investigationReportSnapshot: investigationReport
      };

      const session = new ReviewSession(fileId, 'user_123', propuesta);
      const proposedDecision = session.approve(); // Generate the event (but don't save it yet)

      return reply.send({
        textExtractedLength: text.length,
        textPreview: text.substring(0, 200).replace(/\n/g, ' '),
        evidence: {
          radicados: evidence.radicados.map(r => r.valor),
          procesados: evidence.procesados.map(p => p.valor),
          spoa: evidence.spoa.map(s => s.valor)
        },
        report: {
          estado: report.estado,
          expedienteId: report.expedienteId,
          rutaExpediente: report.rutaExpediente
        },
        proposedDecision,
        durationMs: duration
      });
    } catch (e: any) {
      app.log.error(e);
      return reply.code(500).send({ error: e.message });
    }
  });

  app.post('/approve-decision', async (request, reply) => {
    if (!globalAuthTokens) return reply.code(401).send({ error: 'No autenticado' });
    const decisionEvent = request.body as any;
    if (!decisionEvent || !decisionEvent.eventId) return reply.code(400).send({ error: 'decisionEvent es requerido' });

    try {
      const { SqliteDecisionRepository } = await import('../../../domain/glosador/ApprovalWorkflow/DecisionRepository.js');
      const { ExecutionPlanBuilder } = await import('../../../domain/glosador/ExecutionSystem/ExecutionPlanBuilder.js');
      const { PreflightValidator } = await import('../../../domain/glosador/ExecutionSystem/PreflightValidator.js');
      const { DryRunExecutor } = await import('../../../domain/glosador/ExecutionSystem/DryRunExecutor.js');
      const { GraphClient } = await import('../../graph/impl/GraphClient.js');
      const { GraphOneDriveFileSystem } = await import('../../graph/impl/GraphOneDriveFileSystem.js');
      const { DatabaseManager } = await import('../../sqlite/DatabaseManager.js');

      // Initialize DB connection for SQLite
      const dbManager = DatabaseManager.getInstance();
      try { dbManager.connect(); } catch (e) {}

      // 1. Persist
      const decisionRepo = new SqliteDecisionRepository();
      await decisionRepo.appendEvent(decisionEvent);

      // 2. Build Plan
      const plan = ExecutionPlanBuilder.buildFromDecision(decisionEvent);

      // 3. Preflight
      const config = { environment: 'SANDBOX', tenantId: 'temp', clientId: 'temp', baseUrl: 'https://graph.microsoft.com', apiVersion: 'v1.0' };
      const authProvider = { getAccessToken: async () => globalAuthTokens!.accessToken, invalidateToken: () => {} };
      const transport = {
          request: async (method: string, url: string, options: any) => {
              const response = await fetch(url, { method, headers: options.headers, body: options.body ? JSON.stringify(options.body) : undefined });
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
      
      const excelHash = 'mock_excel_hash';
      const preflightReport = await preflight.validate(
          plan,
          decisionEvent.payload.decision.expedienteId,
          '/expediente/00_IndiceElectronico.xlsx',
          excelHash
      );

      // 4. Dry Run
      const dryRun = new DryRunExecutor();
      const dryRunReport = await dryRun.execute(plan, preflightReport);

      return reply.send({
        success: true,
        planHash: plan.planHash,
        dryRunReport
      });

    } catch (e: any) {
      app.log.error(e);
      return reply.code(500).send({ error: e.message });
    }
  });

  app.get('/logout', async (request, reply) => {
    globalAuthTokens = null;
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
    }
    return reply.send({ ok: true });
  });
}
