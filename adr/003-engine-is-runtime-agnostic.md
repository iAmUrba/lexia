# ADR 003: Engine es Agnóstico del Runtime

## Contexto
LexIA debe poder ejecutarse en diferentes entornos: Node.js (CLI, servidor), Electron (Aplicación de escritorio), o incluso el navegador (Web) para tareas específicas.

## Decisión
El `Engine` de LexIA es estrictamente agnóstico del entorno de ejecución. No puede tener dependencias directas a módulos nativos (ej. `node:fs`, `node:process`). Las métricas del sistema, como el uso de memoria o el acceso a archivos, deben abstraerse a través de interfaces (ej. `RuntimeMetricsProvider`, `DocumentStream`), las cuales serán implementadas e inyectadas por la Capa de Aplicación o los Adaptadores según el entorno.

## Consecuencias
- El motor (`packages/engine`) es puro TypeScript.
- Simplifica enormemente las pruebas unitarias al poder aislar completamente la ejecución.
