# Constancia de Aplazamiento (Jurisdicción Penal)

## Propósito
Plantilla oficial utilizada para generar constancias cuando una audiencia programada no puede llevarse a cabo por inasistencia de alguna de las partes, problemas técnicos, o solicitudes de aplazamiento.

## Variables Disponibles (Marcadores)
Los siguientes campos son proveídos por el proyector (`DocumentModel`):
- `{{header.radicado}}`: Número de radicado de 21 dígitos (Requerido).
- `{{header.juzgado}}`: Nombre del despacho judicial (Requerido).
- `{{hearing.date}}`: Fecha programada para la audiencia.
- `{{hearing.type}}`: Tipo de audiencia (ej. Formulación de Imputación).
- `{{hearing.reason}}`: Motivo del aplazamiento.
- `{{participants.judge}}`: Nombre del Juez.
- `{{participants.prosecutor}}`: Nombre del Fiscal.
- `{{participants.secretary}}`: Nombre del Secretario que expide la constancia.

## Versión Mínima Compatible
LexIA OS Core v1.0.0
