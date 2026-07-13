# Visión de LexIA

LexIA no es un chatbot jurídico.

LexIA no es un generador de documentos.

LexIA no es una interfaz para un modelo de lenguaje.

**LexIA es un Sistema Operativo Jurídico diseñado para asistir el trabajo judicial mediante reglas de negocio, automatización y servicios cognitivos locales.**

> **Mantra:** LexIA no depende de una IA para ser inteligente; utiliza IA como una herramienta para potenciar una inteligencia jurídica que le pertenece al propio sistema.

---

## Principios

Estos principios son la base de nuestra arquitectura y nunca deberían romperse:

- **Offline First:** El sistema debe ser capaz de funcionar de forma autónoma.
- **Privacidad por diseño:** Los datos sensibles nunca deben exponerse innecesariamente.
- **El dominio manda:** La lógica judicial rige el diseño, no al revés.
- **La IA es una herramienta, no una autoridad:** Es un asistente que facilita procesos.
- **Graceful Degradation (Degradación elegante):** Si un servicio falla (ej. LLM), el sistema central debe seguir operando con funcionalidades básicas.
- **Todo debe ser auditable:** Cada acción, decisión o sugerencia debe dejar un rastro claro.
- **Ninguna decisión jurídica depende exclusivamente de un LLM:** Siempre hay un motor de reglas o un humano validando.
- **La experiencia del usuario prevalece sobre la complejidad técnica:** El sistema debe sentirse rápido, intuitivo y sin fricciones.

---

## Arquitectura Conceptual

Las tres capas fundamentales (conceptos, no tecnologías):

```text
Usuario
   ↓
LexIA (Sistema Operativo Jurídico)
   ↓
Inteligencia Jurídica
   ↓
Servicios Cognitivos
   ↓
Infraestructura
```

### Development Runtime vs Production Runtime

Para mantener la abstracción y la velocidad de desarrollo, distinguimos claramente dos entornos:

- **Development Runtime (Desarrollo):** Aquí utilizamos herramientas de terceros instaladas externamente (como Ollama, Python global, Node.js) para iterar rápido. Esto **NO** contradice nuestra arquitectura, simplemente acelera la creación de nuestra lógica de negocio (como el LexIA Reader).
- **Production Runtime (Producción):** Para el usuario final, todo esto desaparece. Entregaremos un único ejecutable (`LexIA.exe`). Cualquier motor de IA, base de datos o runtime necesario vendrá embebido.

**Regla de oro de la abstracción:** *Avanzamos hoy con herramientas maduras (Ollama), pero diseñamos las interfaces de nuestros Servicios Cognitivos para que el proveedor sea 100% intercambiable mañana sin tocar el dominio.*

---

## Los Servicios Cognitivos

Un Servicio Cognitivo **no implica necesariamente IA generativa**. Cada servicio puede usar reglas estáticas, algoritmos, OCR, expresiones regulares, hash, búsqueda semántica o modelos de lenguaje, según sea lo más adecuado y eficiente.

Ejemplos de servicios en nuestra "familia":
- **Reader Service**
- **Classification Service**
- **Drafting Service**
- **Retrieval Service**
- **Audit Service**
- **Summarization Service**
- **Validation Service**

---

## Qué NUNCA hará LexIA

Esta sección marca los límites claros del sistema:

- **Nunca reemplazará el criterio del juez o secretario.**
- **Nunca modificará un expediente sin trazabilidad.**
- **Nunca ejecutará acciones irreversibles sin validación cuando la operación lo requiera.**
- **Nunca dependerá de internet para funcionar.**
- **Nunca delegará reglas jurídicas a respuestas probabilísticas.**

---

## Evolución

El proyecto crece de forma incremental, por capas, no por saltos masivos. Construir un componente a la vez permite validar la arquitectura (almacenamiento, auditoría, métricas) con software funcionando.

```text
Hoy
 ↓
LexIA Reader
 ↓
LexIA Classifier
 ↓
LexIA Drafting
 ↓
LexIA Audit
 ↓
LexIA Brain
```

---

## Qué significa "terminar" una funcionalidad

Decir "ya está hecho" no basta. Una funcionalidad solo está realmente **completa** cuando cumple los siguientes criterios:

- Funciona correctamente según las reglas de negocio.
- Es completamente auditable (deja rastro).
- Tiene pruebas que avalan su funcionamiento.
- Registra eventos correctamente (event sourcing).
- Maneja errores de forma proactiva.
- Degrada elegantemente (si falla un servicio subyacente, el usuario sigue teniendo opciones).
- Está documentada.
- Respeta la arquitectura conceptual y los principios de esta

## El Patrón de Crecimiento
"Primero construimos una plataforma confiable. Después construimos inteligencia sobre ella. La inteligencia sin una plataforma sólida es solo una demostración; una plataforma sólida permite crear un ecosistema."

Y como regla hermana e inquebrantable para el crecimiento de la plataforma:
**"Toda capacidad nueva de LexIA debe poder integrarse como un componente sobre LexIA Platform, sin modificar sus fundamentos."**

## LexIA Pipeline Pattern
El flujo universal, obligatorio y estándar para cualquier operación que altere o introduzca información en el sistema (documentos, autos, expedientes, agendas) sigue un diseño lineal auditable:
```text
Input 
  ↓
Receipt
  ↓
Audit
  ↓
Domain Event
  ↓
Result
```
Esta arquitectura garantiza que la historia de cualquier operación sea reconstruible y confiable en entornos distribuidos.

*Nota: Este documento es la "constitución" del proyecto. No es estático, pero sí muy estable. Modificarlo es un acontecimiento excepcional que requiere una discusión estratégica profunda. Ante cualquier duda técnica, la brújula es: "¿Esto acerca a LexIA a la visión que definimos, o la aleja?"*
