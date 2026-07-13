# ADR 001: El Expediente (Case) es el Agregado Principal

## Contexto
Originalmente, LexIA se construyó alrededor de la ingesta y extracción de un único `Document` (PDF). Sin embargo, el dominio real de un juzgado no gira en torno a un archivo aislado, sino a **Expedientes** que contienen múltiples documentos interrelacionados (autos, sentencias, solicitudes, constancias), compartiendo metadata, líneas de tiempo y participantes.

## Decisión
El modelo de dominio principal de LexIA cambia formalmente de `Document` a `Case` (Expediente).
Un `Case` agrupará la información consolidada extraída de todos los `Document`s que le pertenecen, y operará como la entidad central sobre la que se proyectarán vistas, se planificará la agenda y se redactarán nuevos documentos.

## Consecuencias
- Todo documento nuevo procesado deberá ser asignado a un `Case` (ya sea existente o de nueva creación) basándose en su `Radicado`.
- Los resúmenes judiciales se harán a nivel de `Case`, reflejando la evolución de todo el expediente en la línea de tiempo.
