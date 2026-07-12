# ADR-003: Proyecciones Síncronas durante Baseline 1.0

## Status
Accepted

## Context
El sistema LexIA emplea CQRS y Event Sourcing. Idealmente, las proyecciones (Read Models) deberían actualizarse de manera asíncrona eventual mediante Workers. Sin embargo, para el Baseline 1.0 (Sprint 1), el enfoque es evitar infraestructura innecesaria como colas, outboxes o servicios en background.

## Decision
Las proyecciones se actualizarán **de manera síncrona** inmediatamente después de que el Command Handler finalice el `AppendToStreamAsync` al Event Store, utilizando una interfaz explícita `IProceedingProjectionDispatcher`.

## Consequences
- **Positivas:** Disminuye drásticamente la complejidad operativa inicial. Las lecturas luego de una escritura (Read-Your-Writes) son consistentes instantáneamente.
- **Negativas:** La latencia de la escritura original aumenta ligeramente por la operación de inserción en la tabla de vista. Si el dispatcher falla temporalmente post-commit, se podría requerir reconciliación manual (hasta que implementemos un Outbox robusto en Sprints futuros).
- **Excepción:** Esta decisión tiene fecha de expiración; será reevaluada cuando el volumen de escrituras o la cantidad de vistas justifique una arquitectura de Workers desacoplados.
