# ADR 008: Nunca eliminar menciones (Mentions are Immutable Evidence)

## Contexto
Durante el proceso de Entity Linking (Fase 8.3), múltiples menciones (`ParticipantMention`) se consolidan y normalizan para formar Entidades (`Participant`). Existe la tentación de "limpiar" el documento eliminando las menciones redundantes o fusionándolas de forma destructiva.

## Decisión
Los `ParticipantMention` son inmutables y nunca deben ser eliminados, modificados ni ocultados. El `ParticipantLinker` tiene prohibido borrar menciones; su única responsabilidad es crear **relaciones** (`ParticipantLink`) entre las menciones originales y la entidad consolidada.

## Consecuencias
- Toda mención extraída en la Fase 8.2 permanece intacta, preservando su evidencia (`FieldEvidence`) original en el Asset final.
- Si un usuario pregunta "¿Dónde más se mencionó a esta persona?", el sistema puede responder con precisión sin importar si el texto original decía "Dr. Juan", "Juan Pérez" o "el fiscal".
- Facilita la auditoría manual: si el sistema consolida mal a dos personas, un humano siempre puede revisar el grafo original de menciones inmutables para corregirlo.
