# ADR 012: Document Models precede Renderers

## Contexto
En la Fase 11 (Drafting), LexIA necesita generar documentos judiciales finales (Constancias, Autos, Oficios, etc.) en diversos formatos (DOCX, PDF, HTML, etc.). Inicialmente se consideró acoplar el dominio (`Case`, `Participants`) directamente a los motores de plantillas (`DocxRenderer`), pasando un `TemplateData`. Sin embargo, esto mezcla la lógica de generación de documentos con la lógica del negocio jurídico y dificulta soportar múltiples formatos.

## Decisión
Se establece que **los renderizadores nunca leerán el dominio directamente (`Case`, `Document`, `Participant`)**. En su lugar, el flujo de generación debe pasar por un modelo intermedio agnóstico al formato: el `DocumentModel`.

El flujo establecido es:
1. `Case`
2. `DocumentDefinition` -> `DocumentProjector` (Especializado por tipo de documento, ej: `ConstanciaAplazamientoProjector`)
3. `DocumentModel` (Modelo semántico con títulos, campos, secciones y referencias de explicabilidad XAI)
4. `DocumentRenderer` (Especializado por formato, ej: `DocxRenderer`, `PdfRenderer`)
5. Archivo Final

## Consecuencias
- **Desacoplamiento Tecnológico:** Un `DocxRenderer` solo necesita saber iterar sobre un `DocumentModel` y reemplazar variables, sin importar si los datos vienen de un expediente penal o civil.
- **Soporte Multiformato Gratuito:** El mismo `DocumentModel` generado por el proyector de un "Auto de Sustanciación" puede renderizarse a PDF o enviarse por Email usando diferentes renderers sin escribir lógica nueva.
- **Responsabilidad Única (SRP):** Cada `DocumentProjector` responde únicamente a "¿Cómo se construye semánticamente este documento?", mientras que cada `DocumentRenderer` responde a "¿Cómo se dibuja este modelo en este formato específico?".
- **Explicabilidad Preservada:** El `DocumentModel` es capaz de acarrear referencias `EvidenceReference` (XAI), permitiendo que interfaces gráficas futuras (ej: HTML Renderers) muestren de dónde salió un dato (ej: nombre del fiscal) al hacer clic sobre él.
