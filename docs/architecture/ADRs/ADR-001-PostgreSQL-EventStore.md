# ADR-001: PostgreSQL como Event Store Principal

## Status
Accepted

## Context
LexIA necesita una persistencia inmutable para sus Eventos de Dominio (Event Sourcing). Hay opciones maduras como EventStoreDB, Kafka o DynamoDB, pero introducen una fuerte carga operativa, licenciamientos complejos o eventualidad forzada. Además, para los requerimientos del sector judicial, la robustez relacional y transaccional está altamente valorada.

## Decision
Elegimos **PostgreSQL** utilizando la columna de tipo `JSONB` para almacenar los eventos de dominio.

## Consequences
- **Positivas:** Operación simplificada (tecnología conocida y madura). Transaccionalidad ACID. Capacidad de forzar concurrencia optimista directamente con una restricción `UNIQUE (aggregate_id, version)`. Lecturas de `JSONB` extremadamente eficientes.
- **Negativas:** Carece de suscripciones push nativas para eventos (requerirá polling o WAL tailing/Logical Replication a futuro si se escala a brokers de eventos distribuidos).
- **Evidence Required:** Test E2E demostrando la viabilidad de la concurrencia y deserialización rápida.
