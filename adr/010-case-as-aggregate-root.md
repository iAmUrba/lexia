# ADR 010: El Expediente (Case) como Agregado Principal

## Contexto
Históricamente, LexIA procesaba un único `Document` y deducía de él todos los metadatos y participantes. Al escalar el sistema para convertirse en un sistema operativo judicial, es necesario procesar múltiples documentos que conforman un solo expediente jurídico. Existe la necesidad de modelar qué componente es el dueño del estado general y cómo se relacionan los documentos entre sí.

## Decisión
El `Case` (Expediente) se define como el Agregado Principal (Aggregate Root) del dominio.
- El `Case` encapsula la identidad técnica (`CaseId`), sus identificadores de negocio (`CaseIdentifiers`), la colección de documentos anexos (`CaseDocument`), el `Timeline` maestro y los participantes unificados a nivel de expediente.
- **Direccionalidad estricta:** Un `Document` no conoce la existencia del `Case`. Es el `Case` quien agrupa los `Document`s. 
- Los documentos conservan su propio estado interno (texto, assets, timeline individual), que posteriormente se fusiona en el agregado `Case` a través de utilidades (Mergers).

## Consecuencias
- Habilita la ingesta progresiva: si llega un nuevo documento judicial, se puede procesar como `Document` individual y luego usar un `CaseBuilder` o un `Merger` para sumarlo al `Case` existente.
- Separa la extracción de texto (Document) de la inteligencia legal (Case).
