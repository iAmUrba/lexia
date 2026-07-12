# ADR-007: Event Versioning y Upcasting

**Fecha:** 2026-07-03
**Estado:** Aprobado

## Contexto

Con la adopción de Event Sourcing en LexIA, los eventos de dominio pasan a conformar la única fuente de verdad (Source of Truth) del estado de la aplicación.
Un evento de dominio emitido y persistido es un hecho histórico inmutable. Sin embargo, a medida que el negocio (derecho procesal) y la tecnología evolucionen, la estructura de los eventos cambiará.
Necesitamos una estrategia unificada sobre cómo manejar la evolución del esquema de los eventos, garantizando que los datos históricos puedan ser leídos y comprendidos por las nuevas versiones de los agregados.

## Diferenciación Fundamental de Versiones

Es crucial distinguir dos tipos de versiones que operan en dimensiones completamente distintas dentro del sistema:

1. **Versión del Aggregate (Concurrency Version):**
   * Es un número secuencial (1, 2, 3...) que indica cuántos eventos se han aplicado a un agregado específico a lo largo de su historia.
   * Su propósito es garantizar la concurrencia optimista (evitar conflictos de escritura concurrente) y aplicar leyes algebraicas (orden estricto).

2. **Versión del Esquema del Evento (Schema Version):**
   * Indica la generación estructural del payload de un evento (ej. `ProceedingRegistered V1` vs `ProceedingRegistered V2`).
   * Su propósito es la evolución del contrato público del evento ante cambios de negocio o de diseño.
   * No guarda relación alguna con la versión del Aggregate.

## Decisión

### 1. El Evento como Contrato Permanente
Adoptamos el siguiente principio rector:
> **Todo evento publicado pasa a formar parte del contrato permanente del sistema. Un evento no pertenece únicamente al Aggregate que lo produce; pertenece también a todos los consumidores presentes y futuros.**

### 2. Estrategia de Upcasting
La estrategia por defecto de LexIA para la evolución de esquemas es el **Upcasting en tiempo de lectura**.
* Cuando un evento obsoleto (V1) es leído de la base de datos, un "Upcaster" lo intercepta y lo transforma a la versión más reciente (V2) en memoria, *antes* de que llegue al Aggregate o a cualquier proyector.
* **La reescritura del Event Store histórico está prohibida** salvo una migración operacional extraordinaria aprobada mediante un ADR específico.
* Los Aggregates jamás deberán implementar lógica condicional basada en versiones (ej. `switch(version) { case 1: ... }`). El dominio siempre consumirá la última versión del evento y no tendrá conocimiento de la existencia de generaciones anteriores.

### 3. Pipeline Componible de Upcasters
Los upcasters son componibles (e.g. `UpcasterV1ToV2`, `UpcasterV2ToV3`). La transformación se aplica en cadena, permitiendo que cada upcaster tenga una responsabilidad única y aislada.

### 4. Versionado por Tipo
El esquema evoluciona modelando nuevos tipos C# para nuevas versiones, si hay cambios semánticos considerables (e.g., `ProceedingRegistered` -> `ProceedingRegisteredV2`). El Upcaster convierte de V1 a V2. El agregado de dominio solo conoce y consume la versión vigente (V2).

### 5. SchemaVersion Explícito
Para facilitar el pipeline de Upcasting y detectar la versión de origen, el metadato del evento (`EventMetadata`) alojará explícitamente la propiedad `SchemaVersion`.

### 6. Contratos Tangibles (Golden Files)
Para garantizar la estabilidad del contrato (nombres de propiedades, obligatoriedad, tipos de datos), LexIA implementa *Golden Files*. Los payloads JSON exactos esperados se almacenan físicamente en el repositorio (ej. `ProceedingRegistered.v1.json`). Las pruebas de contrato afirman la igualdad estructural profunda de todo evento contra su Golden File oficial.

## Consecuencias

* **Positivas:** El modelo de dominio permanece completamente agnóstico de su historial de evolución. La base de datos se mantiene verdaderamente "Append-Only". Los Golden Files proveen visibilidad inmediata de los contratos en los diffs de Git.
* **Negativas / Riesgos:** A largo plazo (e.g. V1 -> V2 -> V3 -> V4), la cadena de Upcasters puede volverse compleja de mantener en memoria, requiriendo encadenamiento secuencial o acumulativo. Se debe mantener una suite estricta de pruebas de contrato JSON para cada Upcaster.
