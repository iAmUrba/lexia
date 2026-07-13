# LexIA Platform: Foundation Rules

Este documento define **qué está estrictamente prohibido romper** en la capa base de LexIA (Foundation). Estas reglas protegen la integridad, estabilidad y desacoplamiento de la plataforma sobre la que se asientan todos los Servicios Cognitivos y el Dominio.

## Niveles de Estabilidad de la Arquitectura
> Entre más abajo estés en la arquitectura, más difícil debe ser cambiarte.

- **Foundation:** ⭐⭐⭐⭐⭐ (Muy estable, agnóstico, rara vez cambia)
- **Domain:** ⭐⭐⭐⭐⭐ (Lógica de negocio inmutable judicial)
- **Cognitive Services:** ⭐⭐⭐⭐☆ (Pueden cambiar sus implementaciones o motores subyacentes)
- **Application:** ⭐⭐⭐☆☆ (Orquestación de flujos)
- **Infrastructure:** ⭐⭐☆☆☆ (Bases de datos, APIs externas, sistema de archivos reales)
- **Web:** ⭐☆☆☆☆ (UI, cambia todos los días)

---

## Regla 1: Ignorancia de Dominio
Foundation no conoce absolutamente nada del dominio jurídico.
**NUNCA** podrá importar dependencias de:
* `domain`
* `application`
* `infrastructure`
* `web`

*Si un módulo necesita importar de Domain, está en el paquete equivocado.*

## Regla 2: Embudos de Dependencias
Toda dependencia externa técnica (side-effects) entra por Foundation.
El resto del sistema **NUNCA** usa directamente:
* `crypto`
* `fs`
* `process.env`
* `new Date()`
* `UUID`
* `console.log()`

Todo se utiliza mediante abstracciones de Foundation (`Hash`, `IFileSystem`, `Config`, `Clock`, `Id`, `Logger`).

## Regla 3: Determinismo Funcional
Todo componente propio de lógica en Foundation debe ser determinista.
Dos llamadas iguales producen siempre el mismo resultado.

## Regla 4: IO Pertenece a Infraestructura
Foundation nunca realiza IO innecesario de manera directa (nada de leer archivos reales, bases de datos o HTTP). Foundation define los **contratos** (ej. `IFileSystem`), pero la implementación real (ej. `LocalFileSystem`) pertenece a `Infrastructure`.

## Regla 5: Paso Obligatorio
Ningún Servicio Cognitivo puede saltarse Foundation. Todo registro de log, resultado o error debe fluir por la plataforma base.

## Regla 6: Cobertura Absoluta
Todo objeto público de Foundation debe tener pruebas unitarias al 100%.

## Regla 7: Inmutabilidad
Todo Value Object definido en Foundation (como `DocumentReceipt` o `FileFingerprint`) es inmutable.

## Regla 8: Control de Cambios Estricto
Todo cambio arquitectónico en Foundation requiere un **ADR** (Architecture Decision Record). Cualquier cambio aquí afecta absolutamente todo LexIA.

## Regla 9: Control de Volumen (Bloat)
**Regla de Oro:** Si una utilidad no va a ser utilizada por al menos tres módulos distintos de LexIA, probablemente no pertenece a Foundation. Esto evita que la plataforma se convierta en un "cajón de sastre".

## Regla 10: Prohibición de Dependencias Pesadas
Foundation no debe conocer ni importar ninguna librería "grande". Queda terminantemente prohibido importar:
* `pdf.js`, `Tesseract`, `LangChain`
* `Prisma`, `Drizzle`
* `React`, `Next.js`, `Fastify`
Foundation debe depender casi exclusivamente de TypeScript y APIs estándar del lenguaje (o módulos nativos mínimos) para garantizar portabilidad absoluta.

## Regla 11: Pruebas Deterministas
En el Foundation Test Suite, la regla no es buscar 100% de cobertura por vanidad, sino 100% de estabilidad. Ningún test de la plataforma puede depender del reloj del sistema, del sistema operativo subyacente, ni del orden de ejecución. Todo debe ser simulable y determinista.
