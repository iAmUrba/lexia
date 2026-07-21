# LexIA Planning Guide

Este documento define la arquitectura y reglas para el **CapabilityPlanner**. Mientras el `Engine` es el ejecutor músculo, el `Planner` es el cerebro que decide qué capacidades ejecutar y en qué orden.

## 1. El Grafo de Ejecución (DAG)
LexIA **NO** usa cadenas secuenciales fijas (`A -> B -> C`). LexIA construye un Grafo Acíclico Dirigido (DAG) para maximizar la concurrencia.
Por ejemplo, extraer *Metadata* y *Seguridad* de un PDF son operaciones independientes que pueden paralelizarse.
El Planner analiza el estado del `Document` y devuelve un DAG de ejecución óptimo.

## 2. Decisiones Basadas en Estado
El ruteo se hace evaluando el estado del `Document` (los `Assets` que contiene), no solo eventos externos.
*Ejemplo Correcto:*
- El Planner ve que existe un `ExtractionStatusAsset` con la propiedad `textExtracted: false` y un `MimeTypeAsset` de `application/pdf`.
- Conclusión del Planner: Se necesita invocar a `ocr.image`.

*Ejemplo Incorrecto:*
- El Engine recibe el evento `DocumentNeedsOCR` y llama ciegamente al OCR. (Esto rompe el principio de planeación pura de estado).

## 3. Capability Routing Table
La relación entre un estado y la capacidad a despachar debe ser **declarativa**.
En vez de bloques de `if/else`, el Planner se apoya en un Registro o Tabla de Ruteo:
```
[Estado] MimeType: application/pdf -> [Plan] reader.pdf.metadata, reader.pdf.text
[Estado] ExtractionStatus: failed -> [Plan] ocr.image
```
Esto permite enchufar nuevas capacidades (como `reader.email`) configurando únicamente una nueva línea en la tabla, sin tocar la lógica dura del Planner.

## 4. Reintentos y Degradación
Si una rama del DAG falla, el Planner puede recalcular el plan y ofrecer una ruta de degradación (ej. si falla Tesseract OCR, encolar el uso de Cloud Vision). 
El Engine delega toda decisión estratégica al Planner.
