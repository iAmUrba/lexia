# ADR 005: Las Capabilities Solo Producen Assets

## Contexto
Durante la ejecución del Cognitive Planner, los extractores, identificadores, OCR y demás procesos de inteligencia (`Capabilities`) interactúan con un documento.

## Decisión
Una `Capability` nunca muta directamente un Documento (es inmutable). Su única forma de aportar información al modelo de dominio es retornando uno o más `Assets`. Luego, el `DocumentAssembler` se encarga de empaquetar estos assets en una nueva versión inmutable del Documento, generando su correspondiente `Snapshot` y entrada en el `Timeline`.

## Consecuencias
- Las `Capabilities` se convierten en funciones puras dependientes de su `Input` (generalmente el Documento actual o su Stream subyacente).
- Facilita el testeo de extractores en aislamiento absoluto (mockeando el documento de entrada).
