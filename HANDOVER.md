# 🚀 LEXIA HANDOVER: ESTADO DEL PROYECTO (PC GAMER -> MAC)

*Atención Agente (Mac): Lee este documento antes de hacer cualquier cosa.*

Este documento contiene el contexto exacto de lo que construimos en los últimos 3 días en la PC Gamer. Estamos en un momento crítico del proyecto. **POR FAVOR, LEE CON ATENCIÓN.**

## 1. ESTADO ACTUAL: CODE FREEZE (MVP) 🛑
**Regla de oro absoluta (Artículo 12):** Está terminantemente prohibido agregar nuevas capas de inteligencia, motores, frameworks, bases de datos o funcionalidades hasta que no se complete el UAT (User Acceptance Testing) en un entorno real con la cuenta de Microsoft 365 del juzgado (con 2FA). 

La arquitectura está congelada. El código está congelado. No programes nada nuevo. Todo lo que sigue es probar con datos reales.

## 2. QUÉ CONSTRUIMOS (El Ecosistema)
LexIA dejó de ser un simple "movedor de PDFs" y se convirtió en un modelo verificable del conocimiento operativo del juzgado.

### El Cerebro: Expediente Intelligence Engine (TypeScript)
Todo esto vive en `src/lexia-os/packages/domain/glosador/`:
* **`EvidenceExtractor`:** Lee PDFs y extrae radicados parciales, SPOA, CUI, nombres, fechas, etc.
* **`EvidenceResolver`:** Toma esas evidencias y genera "Hipótesis" para encontrar a qué expediente pertenece, sin casarse con la primera opción. Exige verificación cruzada.
* **`ExcelReader` Dinámico:** Un lector de índices que no depende de columnas fijas. Encuentra los encabezados de forma inteligente, tolerando el desorden humano.
* **`ExpedienteDigitalVivo` (EDV):** La joya de la corona. Un objeto que representa el expediente real. Cruza el índice con los PDFs físicos y determina un `trustStatus` (`CONSISTENTE` o `INCONSISTENTE`).
* **`AnomalyDetector`:** Un auditor interno que detecta: documentos faltantes, saltos de consecutivos justificados (gaps), duplicados y archivos huérfanos. Asigna un `automationLevel` (`AUTO`, `ASSISTED`, `MANUAL`, `BLOCKED`) a cada error para proteger la evidencia del juzgado.

### La Infraestructura
* Módulo `GraphAPIProvider` para leer OneDrive (pendiente probar 100% por el 2FA).
* Backend C# con Clean Architecture, CQRS, Event Sourcing y cálculo de términos procesales.
* Frontend Electron + React + Vite con un diseño premium y oscuro (Lexia OS).

## 3. LA CONSTITUCIÓN DE LEXIA (`.agents/AGENTS.md`)
Hemos codificado 20 Artículos fundamentales que rigen el comportamiento de LexIA. Los más importantes que debes recordar:
* **Art. 12 (No arquitectura infinita):** UAT obligatorio antes de seguir programando.
* **Art. 15 (Las 4 Verdades):** Ninguna fuente es la verdad absoluta. El índice, la carpeta física, la agenda y el PDF son fuentes imperfectas que se cruzan para deducir el estado de confianza.
* **Art. 16 (Memoria del Despacho):** LexIA debe aprender patrones observables del despacho (ej. "este abogado siempre omite el radicado"), NUNCA hacer inferencias psicológicas.
* **Art. 17 (Observador vs Operador):** LexIA puede leer e indexar en segundo plano libremente, pero NO puede modificar, mover ni glosar sin orden humana explícita.
* **Art. 18 (Hechos vs Análisis):** LexIA siempre debe separar lo que es un hecho probado en el expediente, de lo que es un análisis o inferencia suya.
* **Art. 20 (Caja Negra Prohibida):** Cada decisión de LexIA debe explicarse con una traza verificable de evidencias.

## 4. QUÉ SIGUE (Día del UAT)
El próximo paso, cuando Santiago tenga el 2FA, es el "Modo Lanzamiento". 
Deberás observar los logs detalladamente (Telemetría) para certificar que LexIA:
1. Pasa el OAuth.
2. Encuentra la carpeta "JUAN DAVID".
3. Lee los expedientes.
4. Toma un PDF nuevo y atraviesa todo el flujo `EvidenceExtractor -> Resolver -> EDV -> AnomalyDetector` exitosamente con datos del mundo real.

**Toma el relevo con cuidado. ¡La máquina está armada y lista para la nube!**
