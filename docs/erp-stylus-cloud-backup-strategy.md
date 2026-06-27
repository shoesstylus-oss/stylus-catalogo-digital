# ERP STYLUS - Estrategia de respaldo en nube

Este documento define la estrategia de respaldo para un futuro ERP STYLUS con servidor local y copia automatica en la nube. Es documentacion estrategica: no implementa tareas, no mueve datos y no modifica el catalogo actual.

## Objetivos

- Proteger inventario, ventas, clientes, proveedores, imagenes y configuracion.
- Recuperar la operacion ante fallo del servidor local.
- Evitar perdida grave por errores humanos, cortes electricos, ransomware o danos fisicos.
- Mantener copias cifradas fuera del local.
- Validar periodicamente que los respaldos se pueden restaurar.

## Datos a respaldar

| Tipo de dato | Prioridad | Metodo sugerido |
| --- | --- | --- |
| Base de datos PostgreSQL | Critica | Dump diario + WAL/snapshots segun crecimiento |
| Imagenes de producto | Alta | Sincronizacion incremental a nube |
| Archivos de configuracion | Alta | Copia versionada y cifrada |
| Reportes generados | Media | Copia incremental o regeneracion desde base |
| Exportaciones para catalogo | Media | Copia controlada, sin datos sensibles innecesarios |
| Logs de auditoria | Alta | Retencion local y copia nube |

## Estrategia 3-2-1

La estrategia recomendada es 3-2-1:

- 3 copias de los datos importantes.
- 2 medios o ubicaciones distintas.
- 1 copia fuera del sitio, idealmente en nube.

Aplicado a STYLUS:

- Copia activa: servidor local.
- Copia local secundaria: disco externo/NAS o disco secundario del servidor.
- Copia externa: almacenamiento en nube cifrado.

## Frecuencia recomendada

### Base de datos

- Dump completo diario fuera del horario de mayor operacion.
- Retencion diaria por 14 dias.
- Retencion semanal por 8 semanas.
- Retencion mensual por 12 meses.
- Para operacion avanzada: respaldos WAL o incrementales para reducir perdida maxima.

### Imagenes

- Sincronizacion incremental diaria.
- Validacion semanal de conteo/tamano.
- Retencion de versiones si el proveedor nube lo permite.

### Configuracion

- Backup despues de cada cambio operativo relevante.
- Copia cifrada junto con respaldos diarios.

## Destino nube

Opciones viables:

- Azure Blob Storage.
- Amazon S3.
- Backblaze B2.
- Google Cloud Storage.
- Proveedor S3 compatible.

Recomendacion inicial:

- Usar almacenamiento tipo objeto con versionado, cifrado y politicas de retencion.
- Evitar servicios de sincronizacion de escritorio como unica estrategia de backup.
- Separar contenedores/buckets por ambiente: `backups`, `imagenes`, `exports`.

## Cifrado y acceso

Reglas minimas:

- Cifrar backups antes de salir del servidor o usar cifrado fuerte del proveedor.
- Guardar llaves y credenciales fuera del repositorio.
- Usar cuentas de servicio con permisos minimos.
- Rotar credenciales de manera planificada.
- Activar MFA para cuentas administrativas.
- Mantener registro de quien puede restaurar y quien puede borrar respaldos.

## Validacion de respaldos

Un backup no validado debe tratarse como sospechoso.

Validaciones recomendadas:

- Confirmar que el backup se genero.
- Confirmar tamano esperado.
- Confirmar hash o checksum.
- Confirmar subida a nube.
- Restaurar en ambiente de prueba al menos una vez al mes.
- Documentar fecha, responsable y resultado de cada prueba.

## Plan de restauracion

### Escenario 1: error humano

Ejemplos: producto eliminado, ajuste equivocado, imagen reemplazada incorrectamente.

Accion:

- Identificar hora del incidente.
- Restaurar copia puntual en ambiente temporal.
- Extraer solo los datos afectados cuando sea posible.
- Registrar correccion y causa.

### Escenario 2: fallo de disco

Accion:

- Sustituir disco o servidor.
- Instalar base del sistema.
- Restaurar ultimo backup valido.
- Validar inventario, usuarios y ultimos movimientos.
- Reabrir operacion con control manual temporal si hay brecha.

### Escenario 3: servidor local fuera de servicio

Accion:

- Activar equipo alterno o ambiente nube temporal.
- Restaurar base de datos e imagenes.
- Cambiar acceso interno al servidor temporal.
- Registrar movimientos manuales durante interrupcion si aplica.

### Escenario 4: incidente de seguridad

Accion:

- Aislar servidor.
- No sobrescribir backups sanos.
- Revisar logs.
- Restaurar desde punto anterior al incidente.
- Rotar credenciales.
- Auditar usuarios y permisos.

## Riesgos y mitigaciones

### Perdida de datos recientes

Riesgo: el ultimo backup puede tener varias horas de antiguedad.

Mitigacion:

- Reducir ventana con backups incrementales o WAL.
- Programar backups adicionales en dias de alta operacion.

### Backup corrupto

Riesgo: existe archivo pero no restaura.

Mitigacion:

- Validacion automatica.
- Restauracion de prueba.
- Retencion de multiples puntos.

### Borrado accidental de respaldos

Riesgo: usuario o script borra copias.

Mitigacion:

- Versionado.
- Retencion inmutable si el proveedor lo permite.
- Permisos separados para escribir y borrar.

### Credenciales expuestas

Riesgo: acceso no autorizado a backups o datos.

Mitigacion:

- Secretos fuera de repositorios.
- MFA.
- Rotacion.
- Permisos minimos.

### Dependencia total de internet

Riesgo: si no hay internet, no suben respaldos.

Mitigacion:

- Mantener copia local secundaria.
- Cola de reintento.
- Alertas cuando no se sincronice.

## Politica sugerida de retencion

| Copia | Retencion |
| --- | --- |
| Diaria | 14 dias |
| Semanal | 8 semanas |
| Mensual | 12 meses |
| Antes de migraciones grandes | Retencion manual aprobada |
| Antes de publicar cambios masivos | Retencion manual aprobada |

## Indicadores de salud

- Ultimo backup de base de datos: fecha y hora.
- Ultimo backup de imagenes: fecha y hora.
- Resultado del ultimo backup: exitoso/fallido.
- Resultado de ultima restauracion de prueba.
- Espacio disponible local.
- Espacio usado en nube.
- Numero de archivos pendientes de sincronizar.

## Recomendacion para iniciar

Para Fase 1, STYLUS deberia iniciar con:

- PostgreSQL con dump diario automatizado.
- Copia local secundaria.
- Copia cifrada a nube.
- Respaldo incremental de imagenes.
- Reporte diario de exito/fallo.
- Restauracion de prueba mensual.

La meta no es solo tener backups, sino poder recuperar la operacion con confianza.
