# LexIA Engine Guide

El `Engine` es el orquestador principal de LexIA. Este manual detalla la filosofía y las reglas inquebrantables de cómo se deben construir y conectar las Capacidades Cognitivas (Capabilities) en este ecosistema.

## 1. ¿Qué es una Capability?
Es una función altamente especializada, atómica y aislada, que toma un Input determinado, realiza un trabajo cognitivo o computacional (ej. extraer texto, clasificar, detectar idioma) y devuelve un `Snapshot` que contiene propuestas de nuevos `Assets`.
- **Aislamiento**: Una Capability NO sabe de dónde vino el documento ni quién lo llamó.
- **Inmutabilidad**: Una Capability NUNCA modifica el `Document` en curso.
- **Especialización**: Una Capability hace **una sola cosa**.

## 2. Cuándo CREAR una Capability
Crea una nueva Capability si la operación:
- Puede fallar o degradarse de manera independiente al resto del sistema.
- Requiere recursos técnicos específicos (ej. GPU, RAM masiva).
- Podría ser intercambiada en el futuro por otro proveedor (ej. cambiar OCR de Tesseract a Textract).
- Genera un `Asset` de dominio valioso para auditoría y toma de decisiones.

## 3. Cuándo NO crear una Capability
- Si es una operación trivial de infraestructura (ej. descargar archivo de S3). Eso pertenece a `packages/io`.
- Si es lógica de enrutamiento (ej. decidir si hacer OCR o no). Eso pertenece al `CapabilityPlanner`.
- Si la operación muta estado central o cruza responsabilidades.

## 4. Taxonomía de Nombres
La consistencia en el `CapabilityId` es vital para el Planner y la trazabilidad. Usa el formato `dominio.accion.subaccion`.
- **Identificación**: `document.identify`
- **Lectura Estructural**: `reader.pdf.metadata`, `reader.docx.structure`
- **Lectura Profunda**: `reader.pdf.text`, `ocr.image.tesseract`
- **Clasificación**: `classifier.legal-document`

## 5. Reglas de Comunicación
- Las Capabilities **nunca** se llaman directamente entre sí.
- Las Capabilities se comunican inyectando `Assets` al Documento (vía `Snapshot`). 
- Si un proceso posterior depende de algo anterior, debe leer el Documento (en sus precondiciones), no comunicarse directamente con el proceso.

## 6. Manejo de Errores y Degradación
- Ninguna Capability debe tumbar la plataforma entera.
- Si una operación falla, devuelve un `ExecutionResult` fallido. El `Engine` y el `Planner` son responsables de aplicar políticas de reintento o planes B (ej. Si `reader.pdf.text` falla por encriptación, el sistema se degrada grácilmente reportándolo al usuario o administrador).
