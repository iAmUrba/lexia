# Ejecución del E2E Sandbox (Microsoft Graph)

Este pipeline (E2E-1 a E2E-5) verifica que LexIA Core puede integrarse correctamente con un entorno real de Microsoft 365 (Graph API), descargando un PDF, extrayendo evidencia, aprobando una decisión y preparando el `ExecutionPlan` final sin corromper el entorno ni depender de una base de datos externa real.

## Requisitos Previos

Antes de ejecutar este script, debes configurar tus credenciales institucionales de Entra ID.

1. Copia el archivo `.env.example` y renómbralo a `.env` en la raíz de `src/lexia-os`:
   ```bash
   cp .env.example .env
   ```
2. Llena los valores de `TENANT_ID`, `CLIENT_ID` y `DRIVE_ID` con los datos de tu aplicación registrada en Azure.
3. Asegúrate de tener un PDF real en la ruta configurada en `LEXIA_TEST_PDF` dentro de tu OneDrive/SharePoint, así como un archivo Excel para el `LEXIA_TEST_INDEX`.

> **NOTA DE SEGURIDAD**: Nunca hagas commit del archivo `.env`. El archivo ya se encuentra en el `.gitignore`.

## Cómo Ejecutar

Abre una terminal en `src/lexia-os` y lanza el siguiente comando:

```bash
# Exporta las variables si no usas dotenv, o asegúrate de que el script las lea del entorno:
export TENANT_ID="tu-tenant"
export CLIENT_ID="tu-client"
export DRIVE_ID="tu-drive"

npx ts-node packages/infrastructure/graph/test_e2e_real_graph.ts
```

## Flujo de Autenticación (Device Code)

1. Al arrancar, el script generará un enlace (`https://microsoft.com/devicelogin`) y un código temporal en la terminal.
2. Abre el enlace en tu navegador.
3. Ingresa el código e inicia sesión con la cuenta de M365 que tiene acceso al `DRIVE_ID` especificado.
4. Una vez autorizado, el script continuará automáticamente.

## Resultados Esperados

El script ejecuta 5 fases y se detiene automáticamente si alguna falla, previniendo cascadas de errores confusos.
Los resultados de cada corrida se guardan localmente en la carpeta `artifacts/YYYY-MM-DD/run_XXX/`.

Si el flujo es correcto, la consola imprimirá `[PASS]` para cada fase, terminando con un banner de `SUCCESS`.
En caso de un error de permisos (Graph 401/403) o archivo no encontrado (404), el script fallará de forma elegante, registrando el error en el log forense (`execution_error.log`).
