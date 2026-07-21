# LexIA Capability Registry

Este documento actúa como un registro conceptual de las capacidades (*Capabilities*) de cada capa de LexIA. Su objetivo es comunicar a cualquier desarrollador de un vistazo rápido **qué sabe hacer cada módulo**, evitando duplicación de esfuerzos y promoviendo el reuso guiado por el `LexIA Pipeline Pattern`.

## LexIA Platform (Foundation)
La plataforma base proporciona infraestructura técnica agnóstica al dominio.

- [x] **Audit:** Registro inmutable de actores, acciones y niveles de confianza.
- [x] **Events:** Bus de eventos de dominio desacoplado.
- [x] **Hash:** Generación de huellas digitales (`FileFingerprint`).
- [x] **Identity:** Generación de identificadores (UUID) y `CorrelationId`.
- [x] **Clock:** Manejo de tiempo congelable/simulable.
- [x] **Result:** Patrón funcional de manejo de éxitos y fallos.
- [x] **Config:** Tipado y acceso seguro a entorno.
- [x] **Contracts:** Interfaces base (`DocumentReceipt`, `ConfidenceScore`, etc.)
- [ ] **Filesystem:** Abstracción sobre almacenamiento (Local, S3).
- [ ] **Observability:** Métricas, Health, Tracing.

## LexIA Core Services (Application)
Orquestación de operaciones de negocio puras siguiendo el pipeline estándar.

- [x] **DocumentIntake:** Entrada segura de documentos (Pipeline: *Input -> Receipt -> Audit -> Event -> Result*).

## LexIA Reader (Cognitive Service)
Servicio encargado de extraer texto y metadatos de documentos crudos.

- [ ] **DocumentStreamAdapter:** Abstracción de fuentes (Local, Outlook, OneDrive).
- [ ] **OCR:** Reconocimiento óptico de caracteres para imágenes o PDFs escaneados.
- [ ] **PDF Parsing:** Extracción de texto nativo y estructura de PDFs.
- [ ] **Metadata Extraction:** Detección de fechas de creación, autores, firmas digitales.

## LexIA Classifier (Cognitive Service)
Servicio encargado de interpretar el contenido extraído y clasificar el tipo de actuación jurídica.

- [ ] **Classification:** Identificación del tipo documental (Auto, Demanda, Memorial).
- [ ] **Labels:** Asignación de etiquetas semánticas.
- [ ] **Confidence Rating:** Emisión de `ConfidenceScore` respaldado por IA.

## LexIA Writer (Cognitive Service)
Servicio para la generación de borradores procesales.

- [ ] **Drafting:** Generación estructurada de autos y oficios.
- [ ] **Templating:** Inyección segura de datos del dominio en plantillas judiciales.
