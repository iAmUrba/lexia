# Reglas de Generación de Documentos (LexIA)

- **Tipografía Universal:** Cualquier documento generado desde LexIA debe usar estrictamente la tipografía **Century Gothic**.
- **Tamaño General de Textos:** El tamaño debe oscilar entre 9pt y 12pt según necesidad, nunca menos de 9pt ni más de 12pt (como en la Agenda Semanal).
- **Reglas Específicas para Constancias:**
  - El tamaño de fuente por defecto debe ser estrictamente **11pt**.
  - **Límite de Páginas:** Las constancias **nunca** pueden superar 1 página de longitud.
  - Si el contenido de la constancia es muy extenso y provoca un salto a una segunda página, el tamaño de la fuente debe reducirse dinámicamente lo necesario para asegurar que todo encaje en una sola página.
- **Membretes Originales:** Todo documento exportado en `.docx` debe generarse utilizando las plantillas base originales del juzgado (ej. `MEMBRETE EN BLANCO.docx`) inyectando el contenido vía backend (Python u otros scripts), de forma que no se rompan ni reemplacen los encabezados, logos institucionales y pies de página.

- **Arquitectura y Auto-arranque:** LexIA usa un único comando (`concurrently`) para levantar el frontend y el backend de forma simultánea. Este proceso se gestiona mediante el script `start_lexia.sh` y está configurado como un `LaunchAgent` en macOS para arrancar automáticamente al reiniciar la PC.
