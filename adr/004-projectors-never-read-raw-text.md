# ADR 004: Projectors Nunca Leen Raw Text

## Contexto
Las proyecciones (`Projectors`) son responsables de transformar la información extraída (modelo de dominio) en vistas (`Views` o DTOs) fáciles de consumir por la interfaz de usuario, la API o el CLI.

## Decisión
Se establece como regla arquitectónica estricta que **ninguna View ni Projector puede leer texto plano del documento (`PlainTextAsset`) ni ejecutar expresiones regulares sobre él**.
Siempre deberán consumir `Assets` estructurados (ej. `DocumentIndexAsset`, `ParticipantsAsset`).

## Consecuencias
- Toda lógica de extracción (regex, IA, diccionarios) debe vivir exclusivamente dentro del ciclo del `Engine` (Capabilities).
- Evita la duplicación de lógica de extracción.
- Garantiza que si la extracción mejora o cambia, todas las vistas se benefician automáticamente sin ser alteradas.
