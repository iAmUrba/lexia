## FILOSOFÍA Y FLUJO# CONSTITUCIÓN DE LEXIA (Reglas para AG)

> **EL OBJETIVO SUPREMO:** LexIA Core no fue construido para usar inteligencia artificial. Fue construido para que un funcionario deje de perder tiempo organizando expedientes. Todo lo demás es consecuencia de eso.

**REGLA DE ORO:** Todo desarrollo nuevo debe aumentar la tasa de aciertos del Organizador Inteligente o reducir el tiempo de glosado. Si no cumple una de estas dos cosas, NO es prioritario. La Inteligencia Artificial existe para ayudar a organizar los PDFs, no al revés.

**LA HOJA DE RUTA OBLIGATORIA:**
NIVEL 1 (MVP Obligatorio): Que funcione perfectamente el organizador de 10 pasos.
NIVEL 2: Mejorar la precisión del Core (Mejor OCR, mejores RegEx). Cero características nuevas.
NIVEL 3: LexIA Knowledge (Memoria, consultas, LLM). Solo cuando el Nivel 1 sea una roca.

**REGLA DE CONGELACIÓN ARQUITECTÓNICA (¡CRÍTICO!):** La arquitectura del Nivel 1 queda congelada. Mientras el *Definition of Done* no se cumpla, ninguna nueva característica podrá modificar el flujo principal. Las nuevas ideas deberán registrarse en `roadmap_futuro.md` y solo podrán implementarse DESPUÉS de completar el Nivel 1. Prohibido añadir RAG, Dashboards, Estadísticas o Knowledge Graphs hasta terminar el Core.

**MÉTRICA PRINCIPAL DEL PROYECTO:** El éxito de LexIA Core se mide por: 1) % de documentos correctamente asociados. 2) Tiempo ahorrado por documento. 3) % de operaciones completadas sin intervención. 4) % de operaciones canceladas correctamente ante la incertidumbre.

**EL LLM ES PRESCINDIBLE:** Si Ollama deja de funcionar, LexIA Core DEBE seguir organizando documentos. El resumen desaparecerá, pero el flujo principal debe seguir funcionando al 100%.

**EL FLUJO CORE DE INGESTA DOCUMENTAL (10 PASOS INQUEBRANTABLES):**
1. **Vigilar:** Entrar a la carpeta raíz designada (ej. Juan David).
2. **Lectura Completa:** Abrir cada PDF nuevo, leerlo en su totalidad y extraer TODAS las evidencias posibles (Radicado, SPOA, CUI, Cédulas, Víctimas, Defensores, Fiscalía) de forma puramente determinística.
3. **Búsqueda por Evidencia Ponderada:** Intentar primero con la evidencia de mayor poder identificador (Radicado, SPOA, CUI). Si no es suficiente, combinar múltiples evidencias de menor poder (nombres, fechas, defensores) hasta obtener una hipótesis explicable. No actuar como un if...else, sino como un detective.
4. **Encontrar Subcarpeta:** Buscar por patrón la carpeta correspondiente al despacho (ej. "CONOCIMIENTO").
5. **Búsqueda Fuzzy del Índice Electrónico:** No asumir un nombre exacto como `000IndiceElectronico.xlsx`. Buscar todos los candidatos, puntuarlos y abrir el más probable. Si se detectan fórmulas dañadas, estructura desconocida o columnas fusionadas inesperadas, LexIA DEBE detenerse ("No puedo garantizar la integridad") y abortar. NUNCA improvisar en el Excel.
6. **Verificación Estricta:** Comprobar dentro del Excel que las evidencias coincidan.
7. **Sugerir Consecutivo:** Analizar los PDFs para encontrar el consecutivo más alto y sugerir el siguiente. NO mover el PDF.
8. **Preparar Borrador del Índice:** Preparar las celdas respetando absolutamente las fórmulas existentes.
9. **Bandeja de Aprobación (Cadena de Evidencias):** LexIA SIEMPRE espera aprobación manual, pero no solo mostrando un "% de confianza". Debe mostrar exactamente la **Cadena de Evidencias** (qué coincidió y qué no, paso a paso, creando una auditoría perfecta de por qué generó esa hipótesis).
9.5 **Validación Transaccional:** Justo antes de escribir, comprobar que el Excel no cambió, el PDF no fue movido y el consecutivo sigue siendo válido. Si algo cambió: cancelar y recalcular.
10. **Ejecución Asistida y Logging:** Actualizar Excel, mover PDF, renombrarlo. Registrar un log absoluto de la actuación (incluyendo la Cadena de Evidencias completa).

## LAS 10 LEYES DEL CORE (ROBUSTEZ > INTELIGENCIA)
1. **Determinismo:** Mismo PDF + Mismo OneDrive = Mismo Resultado.
2. **No Destrucción (Soft Delete):** Nunca hacer `DELETE`. Usar `deleted_at`. Si falla, abortar, registrar y explicar. No sobrescribir.
3. **Reproducibilidad y Versiones:** Reporte de auditoría completo para cada decisión. Guardar siempre `schema_version` y `engine_version`.
4. **Desacoplamiento y Contratos:** Definir interfaces estrictas antes que implementaciones (ej. `OCRService.extract()`). Los módulos no conocen implementaciones (ej. SQLite vs Graph).
5. **No depender de nombres:** Puntuación heurística para carpetas (e.g. CONOCIMIENTO).
6. **Caché Total:** Disco es barato, tiempo humano no. Guardar OCR, Hash, Graph.
7. **Telemetría Absoluta de Calidad y Tiempos:** Medir OCR, SQLite, Graph, Resolver, Excel, Movimiento, y también # documentos procesados, duplicados detectados, errores.
8. **Dudar antes de fallar:** "No identificado" es mejor que un error guardado en el lugar equivocado.
9. **Errores enseñan:** Cada PDF raro va a `/testdata` obligatoriamente.
10. **Recuperación Automática (Recovery Mode):** Si el sistema crashea en el paso 6, reinicia desde el paso 6. Nunca reprocesa.
11. **Justificación al Componente:** Todo archivo nuevo debe justificar explícitamente qué parte del `Definition of Done` resuelve. Si no, no se crea.

> **REGLA SUPREMA DE EXPLICABILIDAD:** Toda automatización debe poder ser explicada paso a paso por LexIA. Si una decisión no puede explicarse (ej. solo con un "confianza 98%"), no puede ejecutarse automáticamente. LexIA debe poder responder el paso a paso lógico exacto de por qué un PDF terminó en un expediente.

## LEXIA KNOWLEDGE: LA MEMORIA DEL DESPACHO (CAPA 2)
Esta capa secundaria nace automáticamente gracias al `MemoryCrawler` (El Bibliotecario/Historiador).
**PRINCIPIO DE NO INTERFERENCIA:** El `InboxWatcher` (Operador) vigila la bandeja de entrada, propone y escribe (solo tras aprobación). El `MemoryCrawler` (Historiador) puede leer absolutamente todo OneDrive (incluyendo los PDFs nuevos en la bandeja de entrada), PERO JAMÁS PUEDE ESCRIBIR NADA (ni Excel, ni PDFs, ni nombres). Su única función es aprender, relacionar (Procesado -> Expedientes, Fechas, Actas) y construir el grafo de conocimiento pasivamente.

**REGLA ANTI-ALUCINACIONES (RAG ESTRICTO):** LexIA JAMÁS contestará una pregunta jurídica, procesal o de estado usando únicamente la memoria del LLM (Ollama).
El flujo obligatorio para responder al usuario es: 1) Entender Consulta -> 2) Buscar expediente en Memoria Operativa -> 3) Leer documentos reales relacionados -> 4) Extraer Hechos Crudos -> 5) El LLM **únicamente** redacta la respuesta basándose estrictamente en la evidencia extraída.
Esto garantiza que LexIA actúe como un razonador documental y no como un generador de cuentos.

> **REGLA DE EVIDENCIA DE LEXIA (Regla Cero para Producción):** Ninguna funcionalidad podrá declararse terminada, estable o lista para producción sin una evidencia reproducible (test automatizado, benchmark, integración real o ejecución documentada). Si no hay un script corriendo que lo demuestre, no podemos declararlo con certeza.
