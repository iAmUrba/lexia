# ADR 011: Estructuras Derivadas son Desechables (Derived Structures Are Disposable)

## Contexto
Durante el procesamiento de un Expediente (`Case`), se generan estructuras de datos complejas diseñadas para optimizar consultas, interfaces de usuario o análisis de relaciones, tales como el `CaseGraph`, índices especiales, y vistas proyectadas como `CaseSummaryView`.

## Decisión
Se define el principio arquitectónico de que **el Dominio (`Case` y `Document`) es la única fuente de la verdad**. Toda estructura secundaria (Grafos, Vistas, Índices) se considera un componente derivado (Derived Structure) y, por lo tanto, desechable (Disposable).
- Ninguna estructura derivada debe persistirse como si fuera la fuente de verdad.
- Ante la duda, cualquier proyección o índice debe poder ser reconstruido en su totalidad leyendo exclusivamente del modelo base (`Case` y sus correspondientes `Document`s).

## Consecuencias
- Evitamos la temida desincronización de datos (split-brain). Si el grafo dice algo distinto que el `Case`, el grafo está mal y simplemente se regenera.
- El modelo del dominio se mantiene puro, sin incorporar lógicas de consulta, de visualización UI o de optimización de bases de datos de grafos.
- `CaseBuilder` y `CaseProjector`/`CaseGraphBuilder` tienen responsabilidades perfectamente aisladas.
