# Inspección de Código con SonarQube

## Descripción general

Para la inspección de código se utilizó **SonarQube/SonarCloud** sobre una sección relevante del proyecto. Entre los resultados obtenidos se seleccionaron dos *quality issues* considerados importantes, ya que ambos afectan aspectos relevantes del sistema: el primero se relaciona con la **confiabilidad y rendimiento** del código, mientras que el segundo está asociado a la **seguridad** en el manejo de datos ingresados por el usuario.

Si bien SonarQube detectó otros problemas menores relacionados con tipos de datos, retornos de funciones o estilo de código, se decidió priorizar estos dos issues porque tienen un impacto más directo sobre la calidad general del software.

---

## Quality Issue 1: Expresión regular con posible bajo rendimiento

### Screenshot del issue

<img width="1600" height="945" alt="Imagen pegada" src="https://github.com/user-attachments/assets/76b72596-ea72-4a35-afde-3c1511195226" />

### Descripción del problema

El primer issue detectado corresponde a la regla **typescript:S8786**, donde SonarQube recomienda simplificar una expresión regular para reducir su tiempo de ejecución, ya que puede presentar un comportamiento **super-lineal debido a backtracking**.

Este problema aparece en la línea donde se formatea el RUT del usuario:

```ts
const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
```

Esta expresión regular se utiliza para insertar puntos cada tres dígitos en el número del RUT. Aunque funcionalmente cumple su objetivo, SonarQube advierte que algunas expresiones regulares pueden provocar un tiempo de ejecución no lineal cuando el motor intenta múltiples caminos posibles para encontrar coincidencias. Esto puede afectar el rendimiento si se procesan entradas grandes o inesperadas.

Aunque el RUT normalmente tiene una longitud limitada, se considera un issue relevante porque afecta una función relacionada con el procesamiento de datos del usuario. Además, al estar clasificado como **Major**, conviene corregirlo para evitar mantener una expresión regular potencialmente ineficiente.

### Severidad

SonarQube clasifica este issue como:

| Categoría | Valor |
|---|---|
| Tipo | Code Smell |
| Severidad | Major |
| Calidad afectada | Reliability |
| Impacto | Medium |
| Esfuerzo estimado | 20 minutos |
| Regla | typescript:S8786 |

### Recomendación de SonarQube

SonarQube recomienda reducir el backtracking de la expresión regular. Entre las estrategias sugeridas se encuentran:

- Limitar repeticiones dentro del patrón.
- Evitar ambigüedades en las expresiones regulares.
- Usar expresiones más acotadas.
- Reemplazar la lógica por una implementación que no dependa de una expresión regular compleja.

### Cómo será abordado

Esta recomendación será considerada. El problema se encontraba en la forma en que se estaba formateando el número del RUT, ya que originalmente se utilizaba una expresión regular con *lookahead* para insertar los puntos cada tres dígitos.

Antes, el código estaba de esta forma:

```ts
const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
return `${numeroFormateado}-${dv}`;
```

Este código funciona correctamente a nivel visual, ya que transforma un número como `12345678` en `12.345.678`. Sin embargo, SonarQube marca esta expresión regular como una posible fuente de problemas de rendimiento, debido al uso de patrones con anticipación y repetición que podrían generar *backtracking* innecesario.

Para corregirlo, se reemplazará esa expresión regular por una función más explícita y controlada, que separa el número del RUT desde derecha a izquierda en grupos de tres dígitos y luego los une con puntos.

El nuevo código quedaría así:

```ts
const formatearNumeroRut = (numero: string) => {
  const partes = [];

  for (let i = numero.length; i > 0; i -= 3) {
    const inicio = Math.max(i - 3, 0);
    partes.unshift(numero.slice(inicio, i));
  }

  return partes.join(".");
};
```

Luego, el formateo del RUT se simplifica de la siguiente manera:

```ts
const numeroFormateado = formatearNumeroRut(numero);
return `${numeroFormateado}-${dv}`;
```

En resumen, el cambio específico consiste en reemplazar esta línea:

```ts
const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
```

por esta lógica:

```ts
const numeroFormateado = formatearNumeroRut(numero);
```

Con esta modificación se mantiene el mismo resultado visual del RUT, pero se elimina la expresión regular marcada por SonarQube, abordando directamente la recomendación y evitando posibles problemas de rendimiento.

---

## Quality Issue 2: Registro de datos controlados por el usuario

### Screenshot del issue

<img width="1095" height="1030" alt="Imagen pegada (2)" src="https://github.com/user-attachments/assets/9d095e3f-2699-40fb-9743-4d5c17971eb1" />


### Descripción del problema

El segundo issue detectado corresponde a la regla **jssecurity:S5145**, donde SonarQube advierte que no se deben registrar directamente datos controlados por el usuario en los logs del sistema.

El problema aparece en el archivo `AuthCodeController.js`, específicamente en la línea:

```js
console.log("BODY RECIBIDO:", req.body);
```

Este código imprime el contenido completo de `req.body`, el cual puede contener datos enviados por el usuario. En el contexto del proyecto, este controlador está relacionado con la autenticación mediante código, por lo que podría exponer información sensible, como códigos de verificación, RUT u otros datos personales.

SonarQube indica que registrar directamente datos controlados por el usuario puede generar riesgos de seguridad, como **log injection**. Esto ocurre cuando un atacante logra insertar contenido malicioso o manipulado en los logs, dificultando el seguimiento real de eventos del sistema o generando registros falsos.

Aunque la severidad indicada por SonarQube es baja, se considera un issue importante porque está asociado a seguridad y aparece en una sección sensible del sistema. Por esta razón, fue priorizado sobre otros problemas menores detectados por SonarQube.

### Severidad

SonarQube clasifica este issue como:

| Categoría | Valor |
|---|---|
| Tipo | Vulnerability |
| Severidad | Minor |
| Calidad afectada | Security |
| Impacto | Low |
| Esfuerzo estimado | 30 minutos |
| Regla | jssecurity:S5145 |

### Recomendación de SonarQube

SonarQube recomienda evitar construir logs usando directamente datos no confiables o controlados por el usuario. Para JavaScript, la herramienta propone registrar objetos estructurados en vez de concatenar strings, o bien sanitizar los datos eliminando caracteres problemáticos como saltos de línea.

También sugiere que, cuando sea posible, se restrinja el contenido que se registra, evitando guardar información sensible o innecesaria.

### Cómo será abordado

Esta recomendación será considerada. El problema se encontraba en que el código estaba registrando directamente el contenido completo de `req.body` mediante un `console.log`. Esto fue útil durante la etapa de desarrollo para depurar la información recibida por el backend, pero no es recomendable mantenerlo en la versión final del sistema, ya que `req.body` puede contener datos sensibles enviados por el usuario.

Antes, el código estaba de esta forma:

```js
console.log("BODY RECIBIDO:", req.body);
```

Este código imprime en consola todo el cuerpo de la solicitud, incluyendo cualquier dato enviado desde el frontend. En este caso, podría incluir información relacionada con el código de verificación u otros datos del usuario. Por eso, SonarQube recomienda evitar este tipo de logs directos y reemplazarlos por registros más controlados y seguros.

Para corregirlo, se eliminó el log completo de `req.body` y se reemplazó por un mensaje más general, que permite saber que la solicitud fue recibida sin exponer directamente la información enviada por el usuario.

El nuevo código quedaría así:

```js
console.log("Solicitud de verificación recibida");
```

En resumen, el cambio específico consiste en reemplazar esta línea:

```js
console.log("BODY RECIBIDO:", req.body);
```

por esta línea:

```js
console.log("Solicitud de verificación recibida");
```

En caso de que sea necesario mantener información para depuración, se puede usar un log más estructurado y controlado, registrando solamente datos no sensibles. Por ejemplo:

```js
console.log({
  message: "Solicitud de verificación recibida",
  hasCode: Boolean(req.body?.code),
  time: new Date()
});
```

Con esta modificación se aborda directamente la recomendación de SonarQube, ya que se evita registrar el contenido completo enviado por el usuario. Además, se reduce el riesgo de que datos sensibles queden almacenados en los registros del sistema, manteniendo igualmente información útil para depuración de forma más segura.

---

## Recomendaciones consideradas y no consideradas

Las recomendaciones de SonarQube asociadas a estos dos issues serán consideradas en la mejora del código, ya que ambas apuntan a problemas relevantes del sistema.

En el primer caso, se considerará la recomendación de simplificar la expresión regular. La solución será reemplazar el uso de la expresión regular por una función manual de formateo del RUT. Esto permite mantener la funcionalidad actual, pero con una implementación más segura en términos de rendimiento.

En el segundo caso, también se considerará la recomendación de evitar logs con datos controlados por el usuario. La solución será eliminar el `console.log` que imprime el cuerpo completo de la solicitud y, si se requiere mantener trazabilidad, registrar únicamente mensajes generales o datos no sensibles mediante objetos estructurados.

Por otro lado, algunos issues menores detectados por SonarQube, como advertencias de tipos de datos, retornos de funciones o recomendaciones de estilo, no serán abordados de forma prioritaria en esta etapa. Estos no se descartan completamente, pero se consideran mejoras secundarias, ya que no afectan directamente la seguridad ni el rendimiento del sistema.

En resumen, se decidió priorizar las recomendaciones que tienen mayor impacto en la calidad del proyecto. La primera mejora apunta a aumentar la confiabilidad del código evitando expresiones regulares potencialmente ineficientes, mientras que la segunda busca mejorar la seguridad eliminando el registro de información enviada por el usuario.

---

### Resultados
<img width="1186" height="409" alt="Imagen pegada (3)" src="https://github.com/user-attachments/assets/eac01568-d88d-4b66-b83d-3aad96c20d49" />

---

## Conclusión

La inspección realizada con SonarQube permitió identificar problemas relevantes dentro del proyecto. Los dos issues seleccionados fueron considerados importantes porque se relacionan con aspectos críticos de calidad: rendimiento, confiabilidad y seguridad.

El primer issue será corregido reemplazando una expresión regular potencialmente ineficiente por una función manual de formateo del RUT. El segundo issue será corregido eliminando o restringiendo los logs que imprimen información enviada por el usuario.

Estas mejoras permiten reducir riesgos en el sistema, mejorar la calidad del código y dejar registro de decisiones técnicas tomadas a partir de las recomendaciones entregadas por SonarQube.

