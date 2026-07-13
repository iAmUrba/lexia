# ADR 002: Los Assets son inmutables

## Contexto
En el procesamiento de documentos legales, es fundamental mantener la trazabilidad exacta de qué información se extrajo, con qué confianza y mediante qué método.

## Decisión
Todo `Asset` generado por una `Capability` es estrictamente inmutable una vez producido. Si un proceso de inteligencia refina o corrige información (por ejemplo, Entity Linking agrupa dos personas en un solo Participante), no modifica el Asset original. En su lugar, emite un nuevo Asset que lo reemplaza o lo complementa (haciendo uso de un `AssetMergeStrategy` adecuado).

## Consecuencias
- Siempre se puede auditar exactamente cómo lucía el texto o la metadata original extraída antes de cualquier post-procesamiento.
- Simplifica el control de versiones y el historial de cambios en el documento (Timeline).
