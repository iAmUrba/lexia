# ADR 010: Implementación de Políticas de Dominio Puramente Funcionales

## Contexto
El `CaseAggregate` absorbe las validaciones de las reglas cronológicas, de negocio y procesales de un expediente. Para evitar que el aggregate se convierta en un repositorio de lógica acoplada, hemos decidido delegar las reglas complejas a *Policy Objects* (introducidos conceptualmente en ADR-005). Necesitamos definir cómo el aggregate interactuará con dichas políticas de forma que preservemos la pureza del modelo y facilitemos las pruebas unitarias.

## Decisión
El Agregado interactuará con las Políticas (e.g. `IChronologicalConstraintPolicy`) a través de **inyección en los métodos de negocio (Double Dispatch)**, pasándolas como abstracciones. Las implementaciones de las políticas serán pasadas por los Handlers de la capa de aplicación.

Adicionalmente, se establece una **restricción estricta** para las implementaciones de estas políticas:

> Una Policy puede depender únicamente de:
>
> * CaseSnapshot o Estado Interno (CaseState)
> * Entidades o Value Objects del agregado (ej. Proceeding)
> * El Comando entrante (Command / datos a evaluar)
> * Reloj del sistema (si es indispensable y pasado de forma pura/abstracta)
>
> Nunca de:
>
> * Repositories
> * DbContext
> * APIs / HTTP
> * EventStore
> * Servicios (ni siquiera interfaces de estos)
> * DI Container

Las políticas funcionarán de forma esencialmente determinista y como **funciones puras**, evaluando la información residente en el límite de consistencia actual y devolviendo un resultado que indica éxito (`Success`) o error del dominio (`DomainError`), lanzando excepciones funcionales. Esto garantiza que las políticas puedan ejecutarse inalteradas en producción, simulaciones, proyecciones u operaciones offline.

## Consecuencias
* **Positivas**:
  * Evita la degradación arquitectónica y acoplamientos sutiles hacia la base de datos dentro del Dominio.
  * Garantiza un *replay* determinista; si reconstruimos la historia, la política tomará decisiones idénticas porque solo ve eventos/memoria pura, no bases de datos mutables.
  * Tests (Especificaciones Legales) increíblemente limpios y rápidos.
* **Negativas**:
  * Toda la información que requiera una política debe encontrarse en el interior del límite de consistencia del Agregado o ser inyectada al método. Si se requiere información de terceros (ej. un servicio de clima, otra base de datos de competencia), el Command Handler deberá recolectarla antes y enviarla empaquetada como Value Object al método del Agregado, o bien enviar una abstracción pre-calculada (`Decision`).
