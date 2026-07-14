# ADR 014: DocumentModels are deterministic

## Contexto
En la Fase 11 (Drafting), el sistema produce un `DocumentModel` semántico a partir de un `Case`. Si este proceso no es determinista, la misma ingesta de datos podría producir salidas distintas en momentos distintos, complicando la verificación, la auditoría y generando desconfianza en el entorno judicial.

## Decisión
Se establece que **el mismo `Case` y la misma versión del `DocumentProjector` deben producir exactamente el mismo `DocumentModel`, byte por byte** (salvo metadatos explícitos y controlados como la fecha y hora de la generación del propio documento). Todo el proceso de generación documental debe ser reproducible y verificable.

## Consecuencias
- **Testing Simplificado:** Habilita el uso de pruebas de regresión basadas en "Golden Files" (comparando directamente el `expected-document-model.json`).
- **Caché y Rendimiento:** Permite almacenar en caché el modelo generado si el expediente subyacente no ha mutado.
- **Auditoría Judicial:** Al garantizar que las decisiones de extracción y proyección son deterministas, LexIA puede demostrar ante cualquier instancia judicial que los borradores generados son trazables matemáticamente al expediente base.
