# LexIA Core v1.0 - Release Notes

## 1. Estado de la Arquitectura
**[CONGELADA]**
El núcleo ("Core") de la aplicación LexIA, compuesto por el Glosador (Reglas, Decisión, Preflight, Ejecución, Recovery) y sus adaptadores de persistencia en SQLite e integración en memoria, ha sido probado exhaustivamente y su arquitectura base queda congelada en esta versión. Cualquier modificación futura debe concentrarse exclusivamente en las capas de Infraestructura (adaptadores reales de OneDrive y Graph), sin alterar los contratos del Dominio.

## 2. Cobertura de Pruebas
Todos los módulos (`Sprint 1` al `Sprint 5`) están garantizados por una suite completa de pruebas de comportamiento (`verify:all` con 100% SUCCESS):
- Flujo determinista E2E (Lectura, Extracción, Score, Reporte, Decisión, Plan, Preflight, DryRun).
- Idempotencia en todas las operaciones (Event Sourcing).
- Tolerancia a fallos de red simulada (429, 503).
- Mecanismos de recuperación garantizados (`RecoveryManager` a través de SQLite WAL persistente).

## 3. Componentes Estables (No Tocar)
Los siguientes componentes han demostrado rigidez y completitud funcional. **NO se pueden modificar sus firmas ni sus comportamientos internos** sin romper la compatibilidad:
- `ExecutionPlanBuilder`: Generación inmutable y determinista.
- `PreflightValidator`: Bloqueos, permisos y coincidencia criptográfica de Hashes.
- `DryRunExecutor`: Motor transaccional en memoria.
- `DecisionRepository` y `ApprovalOrchestrator`: Flujos de aprobación bajo el modelo Event Sourcing.
- `RecoveryManager`: Motor de compensación y reentrada.

## 4. Riesgos Conocidos (Próximos Pasos)
Antes de ejecutar escrituras en producción (modificar PDFs reales de la corte), se deben solventar los siguientes retos en la capa de integración de Infraestructura:
1. **Flujo de Autenticación M365 (MSAL):** Se requiere sustituir el Mock por un token OAuth2 real provisto por Graph.
2. **Conversión de Paths:** El Core maneja rutas lógicas POSIX (`/inbox/documento.pdf`). Graph API requiere IDs de `driveItem` o mapeos absolutos de OneDrive (`/drives/{id}/items/{id}`).
3. **Bloqueo en Caliente de Excel:** Validar si un expediente en estado "abierto" por un secretario dentro de M365 (SharePoint/OneDrive web) bloquea los `locks` de escritura en la API, provocando rechazos del `ExcelWriter`.

---
*Este reporte sirve como punto de partida oficial para el despliegue del Vertical Slice E2E con datos reales desde el Sandbox de OneDrive.*
