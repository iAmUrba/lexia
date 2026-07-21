import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { GraphClient } from '../infrastructure/graph/impl/GraphClient.js';
import { GraphOneDriveFileSystem } from '../infrastructure/graph/impl/GraphOneDriveFileSystem.js';
import { PdfTextExtractor } from '../domain/glosador/EvidenceSystem/PdfTextExtractor.js';
import { EvidenceExtractor } from '../domain/glosador/EvidenceSystem/EvidenceExtractor.js';
import { ExpedienteRepository } from '../domain/glosador/EvidenceSystem/ExpedienteRepository.js';
import { EvidenceScorer } from '../domain/glosador/EvidenceSystem/Scoring/EvidenceScorer.js';
import { EvidenceResolver } from '../domain/glosador/EvidenceSystem/EvidenceResolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runManualIngestion() {
    console.log('--- Iniciando LexIA Ingestión Manual (Pasos 2 y 3) ---');
    
    // El PDF a procesar se pasa por argumento, o por defecto usamos carta sebastian.pdf
    const pdfName = process.argv[2] || 'carta sebastian.pdf';
    console.log(`[Paso 1 - Manual] Archivo objetivo: ${pdfName}`);

    try {
        // Cargar Autenticación Manual
        const authPath = path.join(__dirname, '.data', '.auth_state.json');
        if (!fs.existsSync(authPath)) {
            throw new Error(`No se encontró .auth_state.json. Ejecuta verify:graph-e2e primero.`);
        }
        const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
        const token = authData.accessToken || authData.token;
        if (!token) throw new Error('Token no encontrado en .auth_state.json');

        const config = { environment: 'SANDBOX', tenantId: 'temp', clientId: 'temp', baseUrl: 'https://graph.microsoft.com', apiVersion: 'v1.0' };
        const authProvider = { getAccessToken: async () => token, invalidateToken: () => {} };
        const transport = {
            request: async (method: string, url: string, options: any) => {
                const response = await fetch(url, { method, headers: options.headers, body: options.body ? JSON.stringify(options.body) : undefined });
                const isJson = response.headers.get('content-type')?.includes('application/json');
                const data = isJson ? await response.json() : await response.text();
                return { status: response.status, headers: response.headers, data };
            }
        };

        const graphClient = new GraphClient(config as any, authProvider as any, transport as any);
        
        console.log('Buscando Drive ID del usuario actual...');
        const meResponse = await graphClient.get<any>('/me/drive');
        const driveId = meResponse.id;
        console.log(`Drive ID: ${driveId}`);

        const fsGraph = new GraphOneDriveFileSystem(graphClient, driveId);

        // Paso 2: Lectura Completa (Descarga y extracción)
        console.log(`\n[Paso 2] Descargando y analizando PDF...`);
        const buffer = await fsGraph.read(pdfName);
        console.log(`PDF Descargado exitosamente (${buffer.length} bytes).`);

        const pdfExtractor = new PdfTextExtractor();
        console.log(`Extrayendo texto con pdf-parse...`);
        const text = await pdfExtractor.extractText(buffer);
        console.log(`Texto extraído: ${text.length} caracteres.`);
        
        if (text.length < 50) {
            console.log(`⚠️ Advertencia: El texto extraído es muy corto. Posible documento escaneado (OCR requerido).`);
        } else {
            console.log(`Vista previa: "${text.substring(0, 100).replace(/\n/g, ' ')}..."`);
        }

        const evidenceExtractor = new EvidenceExtractor();
        const evidence = evidenceExtractor.extract(text);
        console.log(`\nEvidencias encontradas (RegEx):`);
        console.log(`- Radicados: ${evidence.radicados.map(r => r.valor).join(', ') || 'Ninguno'}`);
        console.log(`- Procesados: ${evidence.procesados.map(p => p.valor).join(', ') || 'Ninguno'}`);
        console.log(`- SPOA: ${evidence.spoa.map(s => s.valor).join(', ') || 'Ninguno'}`);

        // Paso 3: Búsqueda Real
        console.log(`\n[Paso 3] Buscando expediente en OneDrive (Graph Search)...`);
        const repository = new ExpedienteRepository(fsGraph);
        const scorer = new EvidenceScorer();
        const resolver = new EvidenceResolver(repository, scorer);
        
        const startTime = performance.now();
        const report = await resolver.resolve(evidence);
        const duration = Math.round(performance.now() - startTime);

        console.log(`\nResultado de la Búsqueda (${duration}ms):`);
        console.log(`- Estado: ${report.estado}`);
        if (report.estado === 'ENCONTRADO' || report.estado === 'MULTIPLE') {
            console.log(`- Expediente ID (Drive Item ID): ${report.expedienteId}`);
            console.log(`- Ruta en OneDrive: ${report.rutaExpediente || 'Desconocida'}`);
        } else {
            console.log(`- No se encontró ninguna carpeta coincidente en el OneDrive.`);
        }
        
        console.log('\n✅ Prueba de Ingestión Manual finalizada con éxito.');
        process.exit(0);

    } catch (err: any) {
        console.error(`\n❌ Error durante la ingestión: ${err.message}`);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    }
}

runManualIngestion().catch(console.error);
