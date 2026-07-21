import { GraphClient } from './impl/GraphClient.js';
import { GraphOneDriveFileSystem } from './impl/GraphOneDriveFileSystem.js';
import { MsalAuthProvider } from './impl/MsalAuthProvider.js';
import { LexIAEnvironment } from './contracts/GraphContracts.js';
import * as fs from 'fs';
import * as path from 'path';

// Asegurarse de tener node-fetch si la versión de Node es antigua
// (Node 18+ trae fetch nativo).

class NodeFetchTransport {
    async request(method: string, url: string, options: any) {
        const response = await fetch(url, {
            method,
            headers: options.headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
            signal: options.signal
        });
        
        let data = null;
        if (response.status !== 204) {
            const text = await response.text();
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch {
                    data = text;
                }
            }
        }

        return {
            status: response.status,
            data,
            headers: Object.fromEntries(response.headers.entries())
        };
    }
}

async function runTests() {
    console.log('--- Iniciando Prueba de Operaciones Graph API ---');

    // 1. Configuración. (El usuario debe llenar ClientId y TenantId, o cargarlo por env)
    const config = {
        apiVersion: 'v1.0',
        baseUrl: 'https://graph.microsoft.com',
        tenantId: process.env.TENANT_ID || 'TU_TENANT_ID',
        clientId: process.env.CLIENT_ID || 'TU_CLIENT_ID',
        scopes: ['Files.ReadWrite.All'],
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID || 'TU_TENANT_ID'}`,
        environment: LexIAEnvironment.SANDBOX
    };

    const driveId = process.env.DRIVE_ID || 'TU_DRIVE_ID'; // ID del Sandbox

    const authProvider = new MsalAuthProvider(config);
    const transport = new NodeFetchTransport();
    
    let telemetryCount = 0;
    const client = new GraphClient(config, authProvider, transport, (tel) => {
        telemetryCount++;
        console.log(`[Telemetría] TraceId: ${tel.traceId} | MS: ${Math.round(tel.elapsedMs)}ms | Status: ${tel.responseCode} | OP: ${tel.operationName}`);
    });

    const fsGraph = new GraphOneDriveFileSystem(client, driveId);

    const testFile = '/sandbox_test/documento.pdf';
    const moveDest = '/sandbox_test/movido/documento.pdf';

    try {
        console.log('\n>> 1. Autenticando (Revisa tu navegador o consola para el Device Code)...');
        await authProvider.getAccessToken();
        console.log('OK - Autenticado exitosamente.');

        console.log('\n>> 2. Obteniendo Metadata (Stat)...');
        const stat = await fsGraph.stat(testFile, { traceId: 'test-stat' });
        console.log(`OK - Metadata obtenida. Tamaño en nube: ${stat.size} bytes. Modificado: ${stat.lastModified}`);

        console.log(`\n>> 3. Verificando lectura y SHA-256 de ${testFile}...`);
        const buffer = await fsGraph.read(testFile, { traceId: 'test-read' });
        const localSha256 = require('crypto').createHash('sha256').update(buffer).digest('hex').toUpperCase();
        console.log(`OK - Descargado. Tamaño del Buffer: ${buffer.length} bytes.`);
        console.log(`OK - SHA-256 Local calculado: ${localSha256}`);
        
        console.log(`\n>> 4. Ejecutando PATCH (Move) hacia ${moveDest}...`);
        await fsGraph.move(testFile, moveDest, { traceId: 'test-move' });
        console.log('OK - Archivo movido.');

        console.log(`\n>> 5. Ejecutando DELETE sobre ${moveDest}...`);
        await fsGraph.deleteFile(moveDest, { traceId: 'test-delete' });
        console.log('OK - Archivo eliminado.');
        
        console.log(`\n✅ PRUEBAS COMPLETADAS. Total de eventos de telemetría: ${telemetryCount}`);
        
    } catch (e: any) {
        console.error('\n❌ ERROR EN LA PRUEBA:', e.message);
    }
}

runTests();
