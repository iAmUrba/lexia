# ADR 013: Templates are versioned artifacts

## Contexto
Las plantillas de documentos judiciales cambian con el tiempo (nuevos formatos de la rama judicial, cambios de jurisdicción, etc.). Si el sistema asume que existe una única plantilla para "Constancia de Aplazamiento", la generación de documentos históricos o de diferentes jurisdicciones fallaría o sería incorrecta. 

## Decisión
Se establece que **las plantillas son artefactos versionados y declarativos**. Cada plantilla debe incluir un manifiesto (`manifest.json`) que defina explícitamente:
- Identificador (`id`)
- Versión (`version`)
- Jurisdicción compatible (`jurisdiction`)
- Idioma (`language`)
- Motor de renderizado requerido (`renderer`)

## Consecuencias
- El sistema de generación (o un `TemplateRegistry`) podrá seleccionar dinámicamente la plantilla correcta basada en los metadatos del `Case` (ej. si el caso es civil, usará la versión civil de la plantilla).
- Evita que los renderizadores "adivinen" qué archivo `.docx` utilizar.
- Protege el sistema contra cambios futuros en el formato judicial, permitiendo mantener versiones `1.0` y `2.0` simultáneamente para casos antiguos vs. casos nuevos.
