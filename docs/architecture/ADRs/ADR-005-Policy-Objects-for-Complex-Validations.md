# ADR 005: Policy Objects para Validaciones Complejas de Dominio

## Contexto
Actualmente, el `ProceedingAggregate` es responsable de garantizar todos los invariantes jurídicos (cronología, estado, reglas de negocio). A medida que LexIA evolucione, estas reglas crecerán significativamente (ej. juez competente, horario judicial, despacho habilitado, estado del expediente, recursos pendientes). Si mantenemos todas estas reglas dentro del Aggregate, la clase violará el principio de Responsabilidad Única (SRP) y se volverá inmanejable.

## Decisión
Se decide que, en el futuro (Sprint 3 o posterior), introduciremos el patrón **Policy Object** (ej. `ProceedingChronologyPolicy`, `ProceedingCorrectionPolicy`, `ProceedingCancellationPolicy`). 

El Agregado delegará las validaciones complejas a estas políticas, pasándoles su estado interno y el comando solicitado. El Agregado seguirá siendo la frontera de consistencia transaccional y el emisor de los eventos, pero no contendrá algoritmos complejos de validación en línea.

## Consecuencias
* **Positivas**: 
  * Mantiene el `ProceedingAggregate` limpio, pequeño y enfocado exclusivamente en transiciones de estado y emisión de eventos.
  * Permite testear las políticas de validación jurídica de manera aislada (unit testing puro de funciones puras).
  * Facilita la composición de reglas jurídicas.
* **Negativas**: 
  * Añade un nivel de indirección.
  * Requiere definir inyección o instanciación de estas políticas dentro del pipeline de comandos.
