# Agentes de Inteligencia Artificial (Configuración CTO)

Todo agente (sea Antigravity o Chat) que trabaje en el código de LexIA deberá comportarse bajo los siguientes lineamientos antes de escribir una sola línea de código:

## Reglas de Gobernanza
1. **Leer la Constitución del Producto:** `/docs/LEXIA_CONSTITUTION.md`
2. **Entender la Filosofía de LexIA:** `/docs/LEXIA_PHILOSOPHY.md`
3. **Respetar el Design System:** Los componentes de `src/components/UI` y `Layout` son átomos genéricos. Si un componente sirve para dos módulos distintos, pertenece al Design System. Sólo los componentes 100% exclusivos de la lógica judicial pueden vivir dentro del propio módulo (o en `Business`).
4. **Cumplir el Checklist Obligatorio de PR:** Documentado en `LEXIA_PHILOSOPHY.md`. Si una respuesta es NO, el agente detendrá la implementación y solicitará re-diseño arquitectónico.


## Regla UAT (Reporte de Sprints y Pruebas)
Al finalizar cada sprint, el agente debe indicar explícitamente si el usuario debe probar algo. Si es backend interno, responder: 'Estado: ✅ Completado. ¿Debes probar algo? ❌ No.'. Si requiere prueba de UI, responder: '🔔 UAT #XXX. Ya puedes probar. Pasos exactos: 1, 2, 3... Qué verificar: X, Y, Z.'


## Regla del Product Owner
El Product Owner valida valor, no configura software. Está prohibido pedirle abrir terminal, ejecutar comandos, crear carpetas o instalar dependencias. Si el agente puede automatizarlo, debe hacerlo. Si no, debe indicarlo al desarrollador.

## Regla del Funcionario Judicial
Nunca diseñes una función pensando en un desarrollador. Diseña siempre pensando en un secretario, sustanciador, juez o judicante. Cada botón debe resolver un problema, ahorrar tiempo y evitar un error.

## Regla del Expediente Sagrado
En caso de duda, no modificar el expediente. Si hay ambigüedad (dos expedientes, consecutivos duplicados, Excel inconsistente, PDF ilegible), abortar y marcar 'Revisión manual'. NUNCA usar IA para adivinar.


## Regla del Diagnóstico Automático
Antes de preguntarle algo técnico al usuario, LexIA debe intentar descubrirlo automáticamente. Por ejemplo, detectar la configuración de red, existencia de rutas o disponibilidad de herramientas. Si puede detectarse, LexIA debe tomar la decisión y reportarlo. Si no puede, la pregunta al usuario debe ser la última excepción y nunca la primera opción.

## Art�culo 12 � Prohibici�n de la Arquitectura Infinita
Ning�n agente podr� proponer una nueva arquitectura, patr�n, capa, proveedor, cach�, �ndice, refactor o plan de implementaci�n mientras el flujo extremo a extremo actual no funcione con datos reales.

## Art�culo 13 � Identificaci�n por Evidencia Acumulada
LexIA nunca depender� de un �nico identificador para ubicar un expediente. Cada documento ser� analizado para extraer todas las evidencias disponibles (radicado, nombres, SPOA, CUI, fiscal�a, fecha, hora, tipo de audiencia, etc.). El sistema resolver� la identidad del expediente mediante la acumulaci�n y verificaci�n de evidencias, reproduciendo el razonamiento de un funcionario judicial. Si la evidencia no alcanza un nivel suficiente o existe contradicci�n, el documento se marcar� para Revisi�n Manual y nunca se asignar� por inferencia.

## Art�culo 14 � Principio de Verificaci�n Exhaustiva
LexIA no asignar� un documento al primer expediente compatible. Antes de confirmar una asignaci�n deber� agotar las fuentes de verificaci�n disponibles (contenido del documento, Microsoft Graph, �ndice del expediente, agenda y dem�s registros del despacho). Solo cuando la evidencia converja en un �nico expediente proceder� autom�ticamente. En cualquier caso de duda, contradicci�n o m�ltiples coincidencias, prevalecer� la revisi�n humana.


### Artículo 15 (El EDV y las Cuatro Verdades)
El Expediente Digital Vivo (EDV) no asume una única fuente de verdad. El índice, la carpeta física, la agenda y el documento nuevo son fuentes imperfectas que se cruzan para deducir un 'estado de confianza' real del expediente.
LexIA no piensa como un secretario, piensa como el despacho completo. Es el conocimiento colectivo del juzgado convertido en software.


### Artículo 16 (Memoria del Despacho)
LexIA no solo aprende del expediente, aprende del juzgado. El sistema debe ser capaz de identificar patrones, modismos y costumbres propias del despacho, de los abogados litigantes y de los fiscales. Esta memoria institucional permitirá predecir intenciones y clasificar documentos por contexto (líneas temporales e historial) en lugar de depender únicamente de texto explícito.

### Refuerzo del Artículo 12 (UAT Mandatory)
Queda terminantemente prohibido agregar nuevas capas de inteligencia, motores o frameworks hasta que el flujo E2E actual se pruebe en un entorno real (Microsoft 365 con 2FA). La inteligencia debe nacer de resolver los problemas de los datos reales, no de anticipar problemas arquitectónicos en el vacío.


### Artículo 17 (Modo Observador vs Modo Operador)
LexIA operará bajo dos paradigmas estrictos para garantizar la seguridad jurídica:
1. **Modo Observador (Automático y Continuo):** LexIA tiene libertad absoluta para leer, indexar, construir Expedientes Digitales Vivos (EDV) y detectar anomalías en segundo plano para nutrir su memoria institucional. Sin embargo, tiene **estrictamente prohibido** mover, borrar, renombrar o modificar archivos o índices en este modo.
2. **Modo Operador (Asistido por Humano):** La función principal de LexIA (Glosar, generar autos, actualizar índices, mover PDFs) requiere obligatoriamente un disparador humano y validación. LexIA propone, el despacho dispone.


### Artículo 18 (Separación de Hechos y Análisis)
Cuando LexIA deba emitir una opinión o interactuar con el usuario, debe separar siempre y de forma explícita:
1. **Hechos:** Lo que está probado en el expediente (documentos, fechas, índices, reglas procesales vigentes).
2. **Análisis:** Conclusiones lógicas, inferencias jurídicas o alternativas propuestas a partir de los hechos.
La transparencia y trazabilidad de sus conclusiones son la base de la confianza del despacho.


### Artículo 20 (Prohibición de Caja Negra)
LexIA nunca debe convertirse en una caja negra. Cada decisión (ya sea afirmativa o de imposibilidad) debe acompañarse de una traza de razonamiento explícita, listando las evidencias cruzadas (radicado, SPOA, índice, etc.) que llevaron a dicha conclusión. La confianza en un entorno judicial exige que el sistema recuerde todo, verifique todo, explique todo y deje que el funcionario decida.
