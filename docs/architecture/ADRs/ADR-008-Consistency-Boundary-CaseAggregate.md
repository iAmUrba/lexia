# ADR-008: Consistency Boundary - CaseAggregate as the Single Aggregate Root

**Fecha:** 2026-07-03
**Estado:** Aprobado

## Contexto

Hasta la fecha, `ProceedingAggregate` funcionaba como un Aggregate Root independiente, emitiendo sus propios eventos (e.g., `ProceedingRegistered`).
A medida que avanzamos hacia el núcleo del "Motor Jurídico" (Sprint 3), se hace evidente la necesidad de implementar invariantes estrictos que abarcan múltiples actuaciones y la historia completa de un expediente. Por ejemplo:
- Cronología estricta: Una actuación B no puede ser anterior a una actuación A si dependen secuencialmente.
- Conflictos lógicos: No pueden existir dos resoluciones definitivas contradictorias en el mismo expediente.
- Estado derivado: Un expediente archivado no debería aceptar nuevas actuaciones de trámite ordinario.

Estas reglas necesitan observar **la historia completa del expediente** para poder bloquear transaccionalmente transiciones inválidas, lo cual es imposible de lograr con garantía de consistencia ACID si cada `Proceeding` vive en su propio stream independiente sin utilizar complejas sagas, bloqueos distribuidos o consistencia eventual que comprometen el rigor jurídico del sistema.

## Decisión

### 1. Cambio del Límite de Consistencia (Consistency Boundary)
Se establece que `CaseAggregate` será el **único Aggregate Root** para el ciclo de vida de las actuaciones procesales.
* `Proceeding` pierde su estatus de Aggregate Root y se convierte en una **Entity interna** gestionada en su totalidad por el `CaseAggregate`.
* Las modificaciones y registros de actuaciones (comandos `RegisterProceeding`, `CancelProceeding`, etc.) se dirigirán y enrutarán a través de `CaseAggregate`.

### 2. Preservación del Lenguaje Ubicuo
El cambio arquitectónico no contamina el lenguaje del dominio. Los eventos emitidos seguirán siendo exactamente los mismos:
* `ProceedingRegistered`
* `ProceedingCancelled`
* `ProceedingCorrected`

El evento describe el hecho jurídico, no quién lo emitió estructuralmente.

### 3. Migración del Stream en Event Store
Los streams del Event Store ahora representarán expedientes.
* El `AggregateId` (y por ende el Stream ID) pasa a ser el `CaseId`.
* Todo evento asociado a una actuación quedará registrado cronológicamente bajo el stream del caso al que pertenece.
* *(Al ser una decisión tomada en fase pre-operacional, se ha optado por un reinicio limpio del entorno de desarrollo sin rutinas complejas de migración de datos históricos inexistentes).*

### 4. Preparación de Idempotencia
Se introduce una colección explícita de `HandledCommandIds` a nivel del `CaseAggregate`. En iteraciones futuras (Sprint 3.2+), esto permitirá aplicar verdadera idempotencia de dominio garantizando que reintentos de red no corrompan la cronología del expediente.

## Consecuencias

* **Positivas:** 
  * Se garantiza consistencia transaccional absoluta para reglas cronológicas y de estado global de un caso.
  * El modelo se alinea con la realidad jurídica: una actuación no tiene sentido aislada del expediente que la contiene.
* **Negativas:** 
  * Casos con miles de actuaciones producirán streams muy largos. A futuro podría ser necesario evaluar estrategias de Snapshotting sobre el `CaseAggregate` si los tiempos de rehidratación impactan en el rendimiento.
