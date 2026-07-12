# ADR 011: Eventos Técnicos de Idempotencia (CommandExecutionRecorded)

## Contexto
Durante el Sprint 3.2 introdujimos la persistencia estricta de la idempotencia en `CaseAggregate`. Cada vez que el aggregate procesa un comando exitosamente, recordamos el `CommandId` (Request Id) para evitar procesar el mismo comando dos veces (ej: reintentos de red, duplicados del bus de comandos). 

Había dos enfoques válidos desde Event Sourcing:
1. **Persistir el `CommandId` como metadato del commit/stream** (dependiendo fuertemente de las capacidades del motor de Event Store).
2. **Persistir la idempotencia mediante un evento técnico** en el stream (e.g. `CommandExecutionRecorded(commandId)`).

## Decisión
Se decidió implementar el Enfoque 2: emitir un evento técnico `CommandExecutionRecorded` explícitamente desde el Aggregate.

### Justificación
* **Independencia del Event Store**: No atamos nuestra lógica de dominio a las capacidades de metadatos de un proveedor de base de datos específico (ej. EventStoreDB vs PostgreSQL JSON).
* **Reproducibilidad durante Replay**: El Aggregate puede recuperar su estado interno de idempotencia (`_handledCommandIds`) de manera puramente funcional, sin requerir APIs externas que lean metadatos.
* **Comportamiento consistente**: La rehidratación funciona de manera idéntica ya sea en los tests de memoria o en producción.

### Trade-offs y Consecuencias
* **Positivas**:
  * Funciona igual sobre PostgreSQL, SQL Server o EventStoreDB.
  * Preserva un determinismo 100% puro al rehidratar la historia sin depender del *provider*.
* **Negativas**:
  * Incrementa (casi duplicando en algunos casos) el número de eventos en un *stream*.
  * Acelera la necesidad técnica de implementar Snapshotting si el caso sufre mucha mutación.

> **Nota de revisión:** La utilización de `CommandExecutionRecorded` se adopta por simplicidad e independencia del Event Store. No constituye una decisión irrevocable. Será reevaluada cuando existan métricas de producción sobre crecimiento de streams, frecuencia de snapshots y coste medio de rehidratación.

* **Snapshotting**: Esta decisión obliga a ser más rigurosos con el uso del *Snapshotting* (ADR-009) debido al volumen extra de eventos.
* **Filtros en Tests**: Requiere explícitamente configurar los Tests de Especificación (`AggregateSpecification`) para ignorar los eventos técnicos en las comprobaciones de estado. No obstante, al hacerlo de manera centralizada en la clase base, no penaliza la legibilidad de la "jurisprudencia".

## Consecuencias
* El modelo de dominio es 100% puro y autónomo respecto a su protección de idempotencia.
* El equipo debe monitorear el tamaño de los streams para calibrar las políticas de Snapshotting.
