# ToolTracking - Sistema de Control y Prestamo de Herramientas

Sistema para la gestion de inventario, prestamos, devoluciones y trazabilidad de herramientas y equipos en zonas industriales y de manufactura, con soporte de asignacion por cuadrillas y perfiles de operacion.

## Informacion del Proyecto

* **Proyecto:** ToolTracking - Control de Inventario y Prestamos
* **Asignatura:** Programacion Digital / Manufactura Aditiva
* **Autores:** Jeime Jimenez y Rhonis Julio
* **Despliegue en Produccion:** [saistracking.github.io/TOOLTRACKING](https://saistracking.github.io/TOOLTRACKING/)

## Cuentas de Acceso y Evaluacion

Para evaluar el sistema se dispone de los siguientes perfiles preconfigurados:

| Rol | Correo Electronico | Clave de Acceso | Alcance y Permisos |
| **Creador**| `jeime@tooltracking.com` | `123456` | Control integral, administracion de cuadrillas, edicion, baja y trazabilidad |
| **Administrador** | `admin@tooltracking.com` | `admin123` | Control general de inventario, gestion de cuadrillas, edicion y eliminacion |
| **Supervisor** | `rhonis@tooltracking.com` | `123456` | Registro de prestamos, recepcion de herramientas y consulta de trazabilidad |

## Arquitectura y Tecnologias

* **Frontend:** HTML5 semantico y CSS3 estructurado bajo diseno responsivo con variables de diseno y modo oscuro.
* **Capa Logica:** JavaScript (ES6+, Web Crypto API para hash SHA-256 y arquitectura asincrona).
* **Persistencia:** Base de datos relacional PostgreSQL provista mediante Supabase con politicas de acceso RLS y cache local.
* **Seguridad:** Aislamiento de variables de entorno mediante GitHub Secrets y prevencion de inyeccion en trazabilidad.
* **Iconografia:** Biblioteca Lucide Icons.

## Modulos del Sistema

### 1. Gestion de Inventario (CRUD)
* **Registro (Crear):** Incorporacion de herramientas con identificador numerico unico, denominacion tecnica y validacion de unicidad.
* **Visualizacion (Listar):** Interfaz dual conmutador entre vista de tarjetas operativas y tabla tabular detallada.
* **Modificacion (Editar):** Ajuste de caracteristicas de herramientas, restringido a los perfiles Creador y Administrador.
* **Baja (Eliminar):** Supresion controlada con modal de confirmacion mandatorio, reservado a perfiles directivos.

### 2. Control de Prestamos y Recepcion
* Salida de herramientas asignadas a operarios con vinculacion a su cuadrilla.
* Validacion de disponibilidad en bodega para evitar asignaciones duplicadas.
* Retorno al inventario general con calculo de tiempo transcurrido y actualizacion de estado en tiempo real.

### 3. Gestion Dinamica de Cuadrillas
* Creacion e integracion de cuadrillas de trabajo sin limites rigidos de grupo.
* Restriccion estricta: solo los roles Creador y Administrador pueden habilitar nuevas cuadrillas.

### 4. Modulo de Trazabilidad y Auditoria
* Registro inmutable de transacciones: prestamos, devoluciones, altas, modificaciones y bajas.
* Auditoria con marca temporal, responsable de autorizacion y observaciones tecnicas.
* Exportacion directa de historial completo a formato CSV compatible con hojas de calculo.

### 5. Metricas del Sistema (Dashboard)
* Monitoreo dinamico de stock: total de activos, unidades en bodega, equipos prestados y operarios activos.

## Instrucciones de Despliegue y Ejecucion

### Ejecucion en Linea
Acceso directo al entorno desplegado:
[saistracking.github.io/TOOLTRACKING](https://saistracking.github.io/TOOLTRACKING/)

### Ejecucion Local
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/saistracking/TOOLTRACKING.git
   ```
2. Abrir el archivo `index.html` en un navegador web compatible (Chrome, Edge, Firefox).
3. Iniciar sesion con cualquiera de las cuentas de prueba documentadas.

## Estructura de la Base de Datos

El archivo [database.sql] define el esquema relacional:
* `herramientas`: Catalogo de equipos, estados de custodia y marcas de tiempo.
* `empleados`: Registro de operarios y cuadrillas asignadas.
* `usuarios`: Cuentas del sistema con credenciales en hash SHA-256 y roles asignados.
* `trazabilidad`: Bitacora inmutable de auditoria de eventos.
