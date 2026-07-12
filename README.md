# LexIA Judicial Platform

LexIA es la plataforma de gestión judicial basada en CQRS, Event Sourcing y determinismo inmutable. La arquitectura está diseñada para sobrevivir décadas sin perder garantías jurídicas.

## Prerequisites

- [.NET SDK 10](https://dotnet.microsoft.com/download/dotnet/10.0)
- Bash & Git

## Bootstrap

Todo desarrollador debe preparar su entorno con un único comando. Este script verifica el SDK, restaura, compila y ejecuta las pruebas y las *Fitness Functions* de la arquitectura.

```bash
./eng/bootstrap.sh
```

Si este comando no termina con `Environment Ready`, el repositorio está roto y no debes hacer commit.

## Repository Layout

La solución respeta fronteras duras de compilación:

- `src/LexIA.Domain/`: Corazón puro del negocio (Cero NuGets externos).
- `src/LexIA.Application/`: Casos de uso y Command Bus.
- `src/LexIA.Infrastructure/`: Implementaciones de persistencia y red (PostgreSQL).
- `src/LexIA.Contracts/`: DTOs y esquemas compartidos.
- `tests/LexIA.Architecture.Tests/`: *Fitness Functions* obligatorias que validan el diseño.

## Engineering Principles

1. **No Broken Windows:** Cero warnings. Cero tests rotos.
2. **El compilador es el primer revisor:** Uso intensivo de `readonly record struct` y `Nullable` estricto.
3. **El dominio no depende de la infraestructura:** Prohibido inyectar bases de datos, ORMs o logs en la lógica del negocio.
4. **Todo Evento es inmutable y determinista.**

## Architecture References

Consulta la "Constitución" completa del proyecto:
- [Directorio de RFCs](docs/architecture/baseline/)
- Las prácticas de ingeniería vivas están definidas en el [RFC-021](docs/architecture/baseline/rfc_021.md).
