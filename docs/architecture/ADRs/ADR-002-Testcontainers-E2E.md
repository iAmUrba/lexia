# ADR-002: Testcontainers como Estándar de Pruebas E2E

## Status
Accepted

## Context
Para probar que el Event Store basado en PostgreSQL maneja correctamente las restricciones `UNIQUE`, la deserialización JSONB y el flujo vertical, no podemos confiar en bases de datos en memoria (InMemory de EF Core o SQLite). Estas soluciones no emulan el comportamiento real del motor de BDD y dan lugar a falsos positivos.

## Decision
Adoptamos **Testcontainers.PostgreSql** para todas las pruebas de integración y End-to-End. 

## Consequences
- **Positivas:** Pruebas 100% fidedignas con el entorno de producción. Garantía de que los scripts SQL y drivers funcionan idénticamente que en el despliegue final.
- **Negativas:** Requiere que el entorno de ejecución o CI tenga el daemon de Docker operativo. Incrementa en unos segundos la ejecución inicial de la suite de pruebas al levantar el contenedor de la imagen Alpine.
- **Evidence Required:** Pipeline CI logrando levantar y destruir la infraestructura efímera en cada Pull Request.
