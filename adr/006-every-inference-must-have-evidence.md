# ADR 006: Toda inferencia debe tener evidencia trazable

## Contexto
En el dominio legal y judicial, las alucinaciones o las clasificaciones sin fundamento son inaceptables. Si LexIA determina que "Juan Pérez" es el Fiscal, o que el radicado es "19001-...", un secretario o juez debe poder verificar exactamente por qué el sistema llegó a esa conclusión.

## Decisión
Se establece como regla estricta que **ninguna inferencia realizada por LexIA puede existir sin una evidencia trazable (`FieldEvidence` o similar)**.
Esto aplica para participantes, roles, fechas, radicados, clasificaciones, OCR o modelos de IA futuros. Toda extracción de conocimiento debe contener un puntero exacto (offset, regla/extractor, confidence) hacia la fuente original de donde se obtuvo la información.

## Consecuencias
- Todo modelo de extracción (ej. `RoleAssignment`, `ParticipantMention`) debe obligatoriamente poseer un atributo de evidencia (ej. `evidence: FieldEvidence`).
- Las interfaces de usuario siempre podrán proveer retroalimentación visual inmediata ("click para ver en el documento original") basada en esta evidencia.
