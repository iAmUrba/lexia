# ADR 006: Guías Arquitectónicas para la Salud de los Aggregates

## Contexto
En arquitecturas basadas en Event Sourcing, los Aggregates tienden a absorber progresivamente mayor responsabilidad a medida que se implementan nuevas reglas de negocio (ej. validaciones, cronologías, estados). Si no existen límites conceptuales, un Aggregate puede convertirse fácilmente en una clase monolítica de miles de líneas que gestiona decenas de transiciones de estado, dificultando su comprensión, mantenimiento e hidratación.

## Decisión
En lugar de imponer límites arbitrarios o métricas de conteo (ej. un máximo de 10 métodos), adoptamos un modelo de evaluación continua basado en **Heurísticas de Complejidad del Dominio**. 

Un Aggregate Root requerirá refactorización (mediante *Policy Objects*, división en sub-Aggregates, o creación de un nuevo *Bounded Context*) si presenta uno o más de los siguientes síntomas:

1. **Ambigüedad de Responsabilidad**: Modifica estados que lógicamente pertenecen a diferentes ciclos de vida jurídicos.
2. **Explosión Combinatoria de Estados**: Las transiciones de estado requieren matrices complejas (más allá de un flujo de estado principal lineal).
3. **Acumulación de Eventos Divergentes**: Comienza a emitir una cantidad de eventos heterogéneos que rara vez se hidratan o consultan en conjunto.
4. **Dependencia de Múltiples Políticas**: La validación de una acción requiere el conocimiento de reglas externas que cambian independientemente del núcleo del Aggregate (ej. festivos, días hábiles).
5. **Hidratación Pesada**: El volumen de historia (Replay) requerida para responder a un comando simple se vuelve excesivo porque el Aggregate agrupa demasiados eventos irrelevantes para dicha acción.

Estas directrices servirán como base durante el Code Review y como "Complexity Index" conceptual.

## Consecuencias
* **Positivas**: Fomenta el diseño y la separación funcional sin bloquear el desarrollo productivo. Mantiene a los Aggregates enfocados en invariantes estrictos.
* **Negativas**: Requiere juicio experto y discusiones arquitectónicas continuas, ya que las heurísticas no pueden automatizarse completamente mediante *Fitness Functions*.
