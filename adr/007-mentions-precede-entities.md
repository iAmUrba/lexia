# ADR 007: Las Menciones preceden a las Entidades (Mentions precede Entities)

## Contexto
Durante la extracción de información, es común caer en la tentación de inferir o crear "Entidades" de manera mágica desde el primer paso (ej. crear directamente a "Juan Pérez" como Participante con el rol de Juez al encontrar su nombre). Sin embargo, un documento contiene texto, no entidades; contiene menciones a personas u organizaciones.

## Decisión
Toda entidad en el sistema (ej. un `Participant`) debe originarse estrictamente a partir de una o más menciones explícitas (`ParticipantMention`) encontradas en los documentos. 
- El `Extractor` inicial solo tiene permitido descubrir **Menciones**.
- Un proceso secundario (ej. `EntityLinker`) es el responsable de agrupar y consolidar esas menciones en **Participantes**.

## Consecuencias
- Se evita que el sistema "invente" participantes de la nada o por alucinaciones.
- Se simplifican las pruebas de los extractores, ya que solo deben validar que encontraron el texto en la página X, línea Y, sin preocuparse por si la persona ya existe en el sistema.
- Prepara la arquitectura para el futuro `ParticipantGraph`, donde una misma entidad agrupa docenas de menciones a través de múltiples documentos del mismo expediente.
