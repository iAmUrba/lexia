# ADR 009: Estrategia de Snapshotting para Aggregates Grandes (CaseAggregate)

## Contexto
Tras la decisión de consolidar el límite de consistencia en un único `CaseAggregate` (ADR-008), prevemos que un expediente jurídico puede acumular cientos o miles de eventos a lo largo de su ciclo de vida (registro de actuaciones, cancelaciones, correcciones, cambios de estado). La rehidratación ingenua de un aggregate leyendo secuencialmente miles de eventos en cada solicitud impactará negativamente en el rendimiento del sistema (aumento del tiempo de reconstrucción y latencia de I/O).

## Decisión
Implementaremos **Snapshotting** periódico para el `CaseAggregate`. El snapshotting será un mecanismo puramente de infraestructura y optimización, invisible para el dominio.

### Reglas de Diseño
1. **Umbral Observable Inicial**: Se realizará un snapshot automático cada vez que la versión del agregado (su `AggregateVersion`) sea un múltiplo de **500**. Este número es provisional y servirá como umbral inicial observable.
2. **Criterio de Ajuste**: El equipo de plataforma revisará este umbral (y lo ajustará) si las métricas de APM revelan que el replay completo de un aggregate supera un tiempo prudente (por ejemplo, 50 milisegundos p95).
3. **Persistencia del Snapshot**: El snapshot debe persistir el estado rehidratado en formato serializado (ej. JSON) asociado a la versión exacta del aggregate y a su ID.
4. **Mecanismo de Rehidratación**: Al cargar un `CaseAggregate`, el `EventStore` buscará primero el snapshot más reciente. Si lo encuentra, aplicará el snapshot y posteriormente cargará y aplicará *solo los eventos ocurridos a partir de la versión de dicho snapshot*.
5. **Idempotencia**: Los snapshots son desechables y pueden recrearse desde el historial base (Event Store) en cualquier momento, ya que la fuente de la verdad sigue siendo la secuencia de eventos.

## Consecuencias
* **Positivas**:
  * Latencia predecible al reconstruir un aggregate complejo.
  * Menor transferencia de red e I/O con la base de datos subyacente.
* **Negativas**:
  * Mayor complejidad en la capa de persistencia e infraestructura (el EventStore debe gestionar dos flujos y sus correspondientes bloqueos o concurrencia).
  * Consumo de almacenamiento adicional para guardar las instantáneas.
