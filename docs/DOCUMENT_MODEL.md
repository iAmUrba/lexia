# LexIA Document Model

Este documento define el corazón conceptual y la estructura de datos más importante de todo LexIA. Cualquier evolución futura del sistema (nuevos modelos de IA, nuevos procesos cognitivos, integraciones externas) deberá respetar este manifiesto.

## 1. ¿Qué es un Document?
El `Document` no es un archivo PDF ni un texto plano. Es una **línea de tiempo inmutable de estado** que representa el conocimiento progresivo que LexIA tiene sobre un documento físico o digital.
- Un `Document` nace como una cáscara vacía (`Intake`).
- A medida que avanza por el `Execution Engine`, se enriquece.
- **Regla de Oro**: Ninguna capacidad cognitiva ni proceso puede modificar un `Document` existente.

## 2. ¿Qué es un Asset?
Para respetar estrictamente el principio **Open/Closed**, el `Document` no tiene propiedades fijas como `texto`, `idioma` o `clasificación`. Está compuesto por una colección dinámica de `Assets`.
Un `Asset` es un paquete de información adosado al documento.
Ejemplos de Assets:
- `MetadataAsset`: Peso, páginas, encriptación.
- `PlainTextAsset`: El texto extraído de la capa nativa.
- `OCRAsset`: El texto y cajas extraídos visualmente.
- `ClassificationAsset`: La predicción del tipo documental.
- `SummaryAsset`: Un resumen ejecutivo del documento.

Si mañana LexIA necesita extraer *Firmas Digitales*, se creará un `SignatureAsset` sin alterar en absoluto la estructura central del Documento ni romper compatibilidad con servicios anteriores.

## 3. ¿Qué es un Snapshot?
Los procesos (`reader.pdf`, `classifier.auto`) nunca devuelven el documento entero. Devuelven un `Snapshot`.
Un `Snapshot` es simplemente un Delta de cambio propuesto (generalmente, un array de nuevos `Assets` que el proceso ha descubierto o generado).

## 4. El DocumentAssembler
Es el único guardián y componente autorizado para generar una nueva versión de un `Document`.
El flujo de ensamblaje es:
1. El `Execution Engine` entrega al `DocumentAssembler` el `Document` actual y un `Snapshot`.
2. El `DocumentAssembler` valida colisiones (Ej: decidir qué hacer si ya existía un `PlainTextAsset`).
3. Clona inmutablemente el documento anterior.
4. Apila los nuevos `Assets`.
5. Actualiza la `Timeline` (historial) del documento.
6. Emite un evento de dominio (`DocumentUpdated`).

## 5. Timeline de Operaciones
No es simplemente un historial de Assets, sino un historial de vida del documento que registra operaciones (Ej. `Document Created`, `Text Extracted`, `OCR Requested`, `Classification Added`).

## 6. La Regla de Oro
> Un Asset nunca modifica otro Asset. Una Capability nunca modifica un Document. Solamente el DocumentAssembler tiene autoridad para producir un nuevo estado del documento.
