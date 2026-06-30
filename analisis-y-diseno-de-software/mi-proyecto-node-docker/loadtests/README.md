# Pruebas de Carga con Apache JMeter

## Plan de Pruebas

Se diseñó un plan de pruebas de performance con 4 pruebas (mínimo solicitado: 3), apuntando a distintos endpoints críticos de la aplicación. El archivo completo del plan se encuentra en `Test_Plan.jmx`, dentro de esta misma carpeta.

| # | Prueba | Endpoint | Método | Usuarios concurrentes | Ramp-up | Resultado esperado |
|---|--------|----------|--------|------------------------|---------|---------------------|
| 1 | Login Masivo | `/api/login` | POST | 100 | 30 s | Respuesta < 1000 ms |
| 2 | Crear Simulación de Crédito | `/api/simulations` | POST | 50 | 20 s | Respuesta < 1000 ms |
| 3 | Consultar Simulaciones | `/api/simulations` | GET | 80 | 25 s | Respuesta < 800 ms |
| 4 | Carga de Documentos (HU09) | `/api/upload-docs` | POST (multipart/form-data) | 30 | 15 s | Respuesta < 2000 ms |

De estas 4 pruebas, se ejecutaron 2 (Prueba 1 y Prueba 4), cumpliendo con el requisito mínimo de ejecutar al menos una.

---

## Razonamiento sobre la cantidad de usuarios concurrentes

Los valores de usuarios concurrentes y umbrales de tiempo no fueron arbitrarios:

- **Login (100 usuarios / 1000 ms):** es el endpoint con mayor probabilidad de concurrencia real, ya que es el punto de entrada de todos los usuarios al sistema. Se eligió un volumen alto (100) para representar un escenario de uso pico (por ejemplo, al inicio de una campaña o promoción).
- **Crear simulación (50 usuarios / 1000 ms):** menos usuarios que el login, ya que no todos los usuarios autenticados llegan a simular un crédito en el mismo instante; es un paso posterior en el flujo.
- **Consultar simulaciones (80 usuarios / 800 ms):** se asume que consultar (lectura) es más frecuente que crear (escritura), de ahí el mayor número de usuarios, pero con un umbral más estricto, ya que una consulta GET simple debería responder más rápido que una operación de escritura.
- **Carga de documentos (30 usuarios / 2000 ms):** se redujo deliberadamente el número de usuarios concurrentes respecto a las otras pruebas, ya que subir archivos (imágenes) implica mayor uso de CPU, memoria y operaciones de E/S en la base de datos (los documentos se guardan como BYTEA). Por esta misma razón, el umbral de tiempo esperado es más alto (2000 ms en vez de 1000 ms), ya que es razonable que una operación de subida de archivos tome más tiempo que una simple autenticación.

---

## Resultados de la ejecución

### Prueba 1 — Login Masivo (100 usuarios concurrentes)

**Resultado:**  Se alcanzó el resultado esperado.

- Todas las 100 peticiones respondieron con código **200 OK**.
- Error Count: 0.
- El tiempo de respuesta osciló entre **5 ms y 8 ms** (ver gráfico `ResponseTimeGraph-Prueba1-LoginMasivo.png`), muy por debajo del umbral esperado de 1000 ms.

**¿Por qué se alcanzó el resultado esperado?**

El endpoint de login realiza una validación de RUT y una única consulta a la base de datos por RUT, sin operaciones costosas adicionales. Esto explica por qué incluso con 100 usuarios concurrentes en una ventana de 30 segundos, el sistema respondió de forma prácticamente inmediata. La carga de 100 usuarios resultó insuficiente para evidenciar cuellos de botella en este endpoint, lo que sugiere que se necesitaría un volumen significativamente mayor para realmente estresar este endpoint en el entorno de pruebas local.

### Prueba 4 — Carga de Documentos (30 usuarios concurrentes)

**Resultado:**  Se alcanzó el resultado esperado, pero con un hallazgo relevante durante la configuración de la prueba.

- Las peticiones respondieron con código **200 OK** una vez corregido un problema de datos de prueba.
- El tiempo de respuesta se mantuvo dentro del umbral de 2000 ms.

**¿Por qué se alcanzó el resultado esperado?**

Al igual que en la Prueba 1, el volumen de usuarios concurrentes "30" no fue suficiente para generar una degradación visible en los tiempos de respuesta, a pesar de que esta operación es más costosa (subida de 2 archivos binarios por petición). Esto indica que, en el entorno de prueba local, la base de datos y el servidor Express soportan sin problema este volumen de escrituras concurrentes de archivos.

---

## Pruebas diseñadas pero no ejecutadas

Las Pruebas 2 (Crear Simulación) y 3 (Consultar Simulaciones) quedaron completamente diseñadas y configuradas en el archivo `Test_Plan.jmx`, cumpliendo con el requisito de diseño mínimo de 3 pruebas, pero no fueron ejecutadas en esta entrega.

---

## Archivos incluidos en esta carpeta

- `Test_Plan.jmx` — Plan de pruebas completo con las 4 pruebas diseñadas.
- `ResponseTimeGraph-Prueba1-LoginMasivo.png` — Gráfico de Response Time de la Prueba 1 (Login Masivo).
- `ResponseTimeGraph-Prueba4-CargaDocumentos.png` — Gráfico de Response Time de la Prueba 4 (Carga de Documentos).
- `README.md` — Este documento, con la explicación de resultados y razonamientos.

---

## Sobre la integridad de las pruebas (no se ajustaron resultados para que pasen)

Siguiendo el principio de que un caso de prueba que falla es tan valioso (o más) que uno que pasa, en ningún momento se modificaron los criterios de éxito, los umbrales de tiempo, ni el comportamiento del sistema bajo prueba para forzar un resultado exitoso. El único ajuste realizado durante el proceso fue corregir un dato de entrada inválido en la Prueba 4 el cual era el formato del RUT enviado, una vez identificada la causa raíz del fallo , y no el resultado de la prueba en sí ni el criterio de aceptación.

Con los volúmenes de carga utilizados (30 a 100 usuarios concurrentes), el sistema respondió siempre dentro de los tiempos esperados, sin generar fallos de performance. Esto no se interpreta como una limitación del proceso de pruebas, sino como una indicación de que el rango de carga evaluado se encuentra por debajo de la capacidad real del sistema en el entorno local de pruebas (Docker + PostgreSQL en un solo host). Para efectivamente "romper" el tiempo de respuesta esperado y evidenciar un defecto de performance, sería necesario escalar significativamente el número de usuarios concurrentes (por ejemplo, a varios cientos o miles, con un ramp-up más agresivo) o ejecutar las pruebas contra un ambiente con recursos más limitados, lo cual queda propuesto como trabajo futuro.