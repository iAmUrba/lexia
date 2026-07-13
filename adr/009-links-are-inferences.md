# ADR 009: Los Enlaces son Inferencias, no Evidencia (Links are Inferences)

## Contexto
A medida que el sistema escala hacia el procesamiento de expedientes (`Case`), el `ParticipantLinker` toma decisiones heurísticas y deterministas para unir menciones (`ParticipantMention`) en identidades consolidadas (`Participant`).

## Decisión
Se establece arquitectónicamente que los enlaces (`ParticipantLink`) son puramente **inferencias computacionales**, y nunca se consideran evidencia dura. La única evidencia inmutable y fáctica es la **Mención** encontrada en el texto original.
Cualquier decisión tomada por un `LinkingStrategy` (por ejemplo, afirmar que "Juan Pérez" en el Documento A es la misma persona que "Dr. Juan Pérez" en el Documento B) tiene un grado de confianza (`confidence`) y un estado de resolución (`LINKED`, `UNRESOLVED`, `CONFLICT`).

## Consecuencias
- Un enlace puede ser revocado o reevaluado en el futuro si el sistema ingiere un nuevo documento con información contradictoria (ej. aparece un segundo "Juan Pérez" con un número de cédula diferente).
- Se facilita la corrección humana: un secretario de juzgado puede marcar un enlace como inválido, y el sistema simplemente descarta la inferencia sin alterar la evidencia original.
