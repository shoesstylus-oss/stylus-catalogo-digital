# ERP STYLUS - Estudio de factibilidad

Este documento evalua la factibilidad de construir un sistema propio STYLUS de inventario, facturacion y catalogo digital antes de iniciar cualquier desarrollo. Es una pieza estrategica: no implementa codigo, no modifica el catalogo actual, no publica productos y no cambia `data/products.json`.

## 1. Situacion actual

### Uso actual de Kordata

Kordata opera como sistema principal para gestion comercial e inventario. En el flujo actual identificado para STYLUS, Kordata mantiene la base operativa de productos, existencias, tallas, sucursales y datos administrativos. El catalogo digital STYLUS consume informacion exportada desde Kordata, no una conexion directa por API.

Flujo observado:

```text
Kordata
  -> exportaciones Excel
  -> importadores STYLUS controlados
  -> enriquecimiento comercial
  -> imagenes
  -> preview
  -> publicacion manual controlada
```

### Dependencias identificadas

- Exportaciones Excel de Kordata para inventario.
- Exportaciones adicionales de productos para obtener URLs de imagen cuando Kordata las incluye.
- Datos administrativos que no deben versionarse completos si contienen informacion operativa sensible.
- Revision manual o semiautomatica para imagenes, porque no todos los Excel exportan las URLs.
- Catalogo publico actual basado en `data/products.json`.
- Flujos de preview y publicacion segura para evitar publicar productos incompletos.

### Limitaciones encontradas

#### Imagenes

- El Excel de inventario no exporta imagenes.
- Las imagenes existen en Kordata y pueden estar alojadas en Azure Blob Storage.
- Se requiere exportacion adicional, revision en navegador o metodo semiautomatico para capturar URLs.
- No se debe descargar imagenes automaticamente sin una decision operacional clara.
- Para productos estrategicos, STYLUS debe preferir imagenes propias aprobadas visualmente.

#### Integraciones

- No se ha asumido API disponible de Kordata.
- No se usan credenciales ni scraping automatizado.
- La integracion actual es por archivos exportados, lo que reduce riesgo pero exige procesos manuales y validaciones.

#### Exportaciones

- Los Excel pueden incluir encabezados administrativos antes de la tabla real.
- Las columnas no siempre cubren todo lo requerido para catalogo comercial.
- Exportaciones reales pueden contener datos sensibles como costos, inventario vigente o informacion interna.
- Las muestras versionadas deben ser ficticias o controladas.

#### Control de datos

- STYLUS depende de la estructura y disponibilidad de exportaciones Kordata.
- El enriquecimiento comercial, imagenes y publicacion requieren capas propias para no contaminar el catalogo publico.
- El control total de datos solo se logra con una base propia gobernada por STYLUS.

## 2. Comparacion estrategica

### Alternativa A: continuar solo con Kordata

Descripcion: mantener Kordata como sistema principal y usar exportaciones manuales para catalogo y reportes.

Ventajas:

- Menor inversion inicial.
- Menor cambio operativo.
- Menor riesgo de interrupcion inmediata.
- El equipo conserva una herramienta conocida.

Desventajas:

- Dependencia de exportaciones.
- Menor control sobre estructura de datos.
- Integracion limitada con catalogo digital.
- Manejo de imagenes incompleto o indirecto.
- Dificultad para automatizar procesos propios.
- Riesgo de bloqueo si Kordata cambia formatos o acceso.

Mejor uso:

- Corto plazo.
- Operacion estable mientras se prepara arquitectura propia.
- Fuente de verdad temporal durante migracion.

### Alternativa B: ERP STYLUS propio

Descripcion: construir sistema propio para inventario, facturacion, catalogo, clientes, proveedores, reportes y multi-sucursal.

Ventajas:

- Control total de datos.
- Integracion nativa con catalogo.
- Flujos comerciales disenos para STYLUS.
- Mejor automatizacion de imagenes, publicacion y WhatsApp.
- Independencia tecnologica.
- Escalabilidad por fases.

Desventajas:

- Mayor inversion inicial.
- Requiere mantenimiento tecnico.
- Requiere disciplina de backups, seguridad y soporte.
- Riesgo de migracion si se intenta reemplazar Kordata demasiado rapido.
- Requiere capacitacion de usuarios.

Mejor uso:

- Mediano y largo plazo.
- Control comercial propio.
- Integracion fuerte con catalogo digital, WhatsApp y reportes.

### Alternativa C: modelo hibrido Kordata + ERP STYLUS

Descripcion: mantener Kordata operativo mientras STYLUS construye su propio ERP por fases, empezando con inventario/catalogo y avanzando hacia ventas, clientes y multi-sucursal.

Ventajas:

- Menor riesgo de interrupcion.
- Permite comparar datos contra Kordata.
- Permite construir valor comercial sin reemplazo brusco.
- Facilita migracion por lotes.
- Permite que el catalogo digital mejore desde temprano.

Desventajas:

- Doble operacion temporal.
- Requiere conciliacion.
- Puede generar duplicidad si no hay reglas claras.
- Requiere definir que sistema manda en cada fase.

Mejor uso:

- Estrategia recomendada.
- Transicion controlada desde Kordata hacia ERP STYLUS.
- Validacion real antes de mover facturacion o inventario critico.

## 3. Analisis financiero

Los costos siguientes son rangos preliminares para planificacion. Deben validarse con cotizaciones reales antes de comprar hardware, contratar nube o iniciar desarrollo. Los montos estan expresados en USD para facilitar comparacion.

### Supuestos

- STYLUS inicia con servidor local, respaldo nube y desarrollo por fases.
- El catalogo publico actual se mantiene mientras se construye el ERP.
- No se incluye costo interno de tiempo del equipo STYLUS salvo capacitacion/operacion.
- No se incluyen obligaciones fiscales especificas de facturacion electronica hasta validar requerimientos legales.
- Los rangos bajos asumen implementacion austera; los rangos altos asumen mayor soporte, monitoreo y formalizacion.

### Costos estimados a 1 ano

| Rubro | Rango estimado |
| --- | ---: |
| Servidor local o mini servidor dedicado | 800 - 2,500 |
| UPS | 150 - 600 |
| SSD principal y respaldo local | 200 - 800 |
| Respaldo nube | 120 - 600 |
| Dominio/certificados/servicios menores | 50 - 300 |
| Seguridad y red inicial | 100 - 700 |
| Desarrollo Fase 1/Fase 2 inicial | 4,000 - 18,000 |
| Mantenimiento y soporte inicial | 1,200 - 6,000 |
| Capacitacion y documentacion | 300 - 1,500 |
| Total estimado 1 ano | 6,920 - 31,000 |

### Costos estimados a 3 anos

| Rubro | Rango estimado acumulado |
| --- | ---: |
| Hardware inicial y mejoras | 1,200 - 4,000 |
| Reemplazos/expansion de almacenamiento | 300 - 1,500 |
| Respaldo nube | 360 - 2,400 |
| Seguridad, red y monitoreo | 600 - 3,000 |
| Desarrollo acumulado Fases 1-4 | 12,000 - 55,000 |
| Mantenimiento y soporte | 4,800 - 24,000 |
| Capacitacion y mejora de procesos | 900 - 4,500 |
| Total estimado 3 anos | 20,160 - 94,400 |

### Costos estimados a 5 anos

| Rubro | Rango estimado acumulado |
| --- | ---: |
| Hardware inicial, renovacion parcial y expansion | 2,000 - 7,000 |
| Respaldo nube y almacenamiento historico | 600 - 5,000 |
| Seguridad, red y monitoreo | 1,200 - 6,000 |
| Desarrollo acumulado Fases 1-5 | 20,000 - 90,000 |
| Mantenimiento y soporte | 9,000 - 45,000 |
| Capacitacion y documentacion continua | 1,500 - 7,500 |
| Total estimado 5 anos | 34,300 - 160,500 |

### Infraestructura local

Costos principales:

- Servidor local.
- SSD/NVMe principal.
- Disco secundario o NAS para copia local.
- UPS.
- Red interna estable.
- Mantenimiento fisico.

Beneficio financiero:

- Costo mensual bajo despues de compra inicial.
- Control directo sobre operacion.
- Menor dependencia de internet para operacion local.

Riesgo financiero:

- Fallos fisicos requieren reemplazo.
- Sin soporte tecnico, el ahorro puede convertirse en riesgo operativo.

### Infraestructura nube

Costos principales:

- Almacenamiento de backups.
- Transferencia de datos si aplica.
- Monitoreo.
- Servidor cloud futuro si se migra a nube o hibrido.

Beneficio financiero:

- Respaldo fuera del sitio.
- Escalabilidad.
- Mejor recuperacion ante desastre.

Riesgo financiero:

- Costos mensuales crecen con datos, imagenes y retencion.
- Mala configuracion puede exponer datos o elevar costos.

### Licencias

Opciones:

- Usar stack abierto: PostgreSQL, Node.js, Linux, herramientas open source.
- Pagar servicios gestionados si reducen carga operativa.
- Mantener licencias actuales mientras Kordata siga operando.

Recomendacion:

- Priorizar tecnologias abiertas para reducir dependencia.
- Pagar servicios solo donde reduzcan riesgo: backups, monitoreo, seguridad o soporte.

### Mantenimiento

Debe presupuestarse desde el inicio.

Incluye:

- Actualizaciones de seguridad.
- Revision de backups.
- Soporte de usuarios.
- Correccion de errores.
- Ajustes por cambios de operacion.
- Mejoras al catalogo e integraciones.

## 4. Infraestructura recomendada

### Servidor local

Recomendacion:

- Equipo dedicado para ERP, no computadora de uso diario.
- Procesador moderno de gama media.
- 16 GB RAM minimo; 32 GB recomendado para crecimiento.
- SSD/NVMe para sistema y base de datos.
- Disco secundario o NAS para backup local.
- Sistema operativo estable y mantenible.

### UPS

Recomendacion:

- UPS con capacidad suficiente para servidor, red y almacenamiento.
- Apagado controlado ante cortes prolongados.
- Revision periodica de baterias.

### Almacenamiento SSD

Recomendacion:

- SSD/NVMe para base de datos.
- Separar respaldo local del disco principal.
- Monitorear salud del disco.
- Mantener espacio libre suficiente para backups temporales.

### Respaldo automatico

Recomendacion:

- Backup diario de base de datos.
- Copia local secundaria.
- Copia cifrada en nube.
- Retencion diaria, semanal y mensual.
- Prueba mensual de restauracion.
- Alerta cuando falle un backup.

### Acceso multi-sucursal

Recomendacion inicial:

- Acceso web interno con HTTPS.
- VPN para sucursales.
- Usuarios nominales.
- Roles por sucursal y modulo.
- Auditoria de movimientos.

Evolucion futura:

- Arquitectura hibrida o cloud si el acceso multi-sucursal requiere mayor disponibilidad.
- Replica o servidor cloud segun crecimiento real.

### Seguridad

Recomendacion:

- Sin credenciales en repositorios.
- MFA para cuentas administrativas.
- Politica de contrasenas.
- Permisos minimos por rol.
- Logs de auditoria.
- Backups cifrados.
- Actualizaciones planificadas.
- Acceso remoto solo por canal seguro.

## 5. Arquitectura tecnologica recomendada

### Base de datos

Recomendacion: PostgreSQL.

Motivos:

- Transacciones confiables.
- Modelo relacional apto para inventario, ventas y facturacion.
- Herramientas maduras de backup.
- Buen camino de migracion hacia nube si se requiere.

### Backend

Recomendacion: Node.js con arquitectura modular.

Opciones:

- Fastify para API ligera y rapida.
- NestJS para estructura empresarial mas formal.
- Express solo si se mantiene disciplina modular.

Responsabilidades:

- Reglas de negocio.
- Validaciones.
- Permisos.
- Auditoria.
- Integraciones.
- Exportaciones para catalogo.

### Frontend

Recomendacion: aplicacion web interna.

Opciones:

- React si se prioriza ecosistema y componentes.
- Vue si se prioriza curva de aprendizaje simple.
- Interfaz responsive para escritorio y tablets.

### API

Recomendacion:

- API REST interna para Fase 1.
- Versionado de endpoints desde temprano.
- Autenticacion y autorizacion por rol.
- Logs de cambios criticos.
- Separar API interna del catalogo publico.

### Almacenamiento de imagenes

Recomendacion:

- Carpeta controlada local para imagenes propias y cache.
- Copia nube en almacenamiento tipo objeto.
- Estados de imagen: pendiente, asignada, revisar, aprobada, rechazada.
- Optimizar imagenes para catalogo antes de publicarlas.

### Estrategia de backups

Recomendacion:

- `pg_dump` diario al inicio.
- Copia local secundaria.
- Copia nube cifrada.
- Retencion por dias, semanas y meses.
- Restauracion de prueba mensual.
- Considerar WAL o replicas cuando ventas/facturacion entren en produccion.

## 6. Riesgos

### Migracion desde Kordata

Riesgo:

- Diferencias entre datos importados y operacion real.
- Campos no exportados.
- Duplicados o datos incompletos.
- Cambio en formato de Excel.

Mitigacion:

- Migrar por lotes.
- Comparar reportes con Kordata.
- Mantener Kordata como fuente temporal.
- No reemplazar facturacion hasta validar inventario y movimientos.

### Perdida de datos

Riesgo:

- Error humano, fallo de disco, corrupcion o incidente de seguridad.

Mitigacion:

- Backups automaticos.
- Pruebas de restauracion.
- Auditoria.
- Permisos minimos.
- Copias fuera del sitio.

### Disponibilidad

Riesgo:

- Fallo del servidor local, energia o internet.

Mitigacion:

- UPS.
- Procedimiento de operacion temporal.
- Servidor alterno o restauracion en nube.
- Monitoreo de salud.

### Seguridad

Riesgo:

- Acceso no autorizado a datos comerciales, inventario, clientes o facturacion.

Mitigacion:

- VPN/HTTPS.
- MFA.
- Roles.
- Logs.
- Cifrado.
- Separacion de credenciales.

### Costos ocultos

Riesgo:

- Soporte, capacitacion, correcciones, crecimiento de almacenamiento, cambios legales o integraciones no previstas.

Mitigacion:

- Presupuesto anual de mantenimiento.
- Roadmap por fases.
- Alcance cerrado por etapa.
- Revision financiera trimestral.

## 7. Beneficios esperados

### Control total de datos

STYLUS podria definir sus propios modelos de productos, variantes, tallas, sucursales, clientes, imagenes y reportes sin depender de exportaciones parciales.

### Integracion nativa con catalogo

El catalogo digital podria alimentarse desde reglas internas:

- Producto publicable.
- Imagen aprobada.
- Disponibilidad positiva.
- Precio vigente.
- Descripcion comercial completa.
- Preview antes de publicar.

### Integracion WhatsApp

El sistema podria generar enlaces, mensajes y seguimiento comercial desde el propio catalogo.

Beneficios:

- Mejor trazabilidad de consultas.
- Mensajes consistentes.
- Potencial CRM futuro.

### Escalabilidad

Un ERP propio permite crecer hacia:

- Multi-sucursal.
- Reportes gerenciales.
- Ventas y facturacion.
- Clientes y CRM.
- Integraciones futuras.

### Independencia tecnologica

STYLUS reduce dependencia de formatos externos y puede adaptar procesos a su manera de vender, surtir, fotografiar y publicar productos.

## 8. Cronograma preliminar

### Fase 0: estudio y arquitectura

Duracion preliminar: 2 a 4 semanas.

Objetivos:

- Aprobar estrategia.
- Definir arquitectura.
- Estimar costos.
- Definir responsables.
- Acordar politica de datos y backups.

### Fase 1: inventario y productos

Duracion preliminar: 6 a 12 semanas.

Objetivos:

- Modelo de productos.
- Existencia por sucursal.
- Movimientos.
- Importacion controlada desde Kordata.
- Reportes de conciliacion.

### Fase 2: imagenes y catalogo

Duracion preliminar: 4 a 10 semanas.

Objetivos:

- Gestor de imagenes.
- Enriquecimiento comercial.
- Preview.
- Publicacion controlada.
- Reportes de calidad.

### Fase 3: ventas y facturacion

Duracion preliminar: 8 a 16 semanas.

Objetivos:

- Registro de ventas.
- Facturacion.
- Anulaciones.
- Corte diario.
- Descuento de inventario.
- Auditoria.

### Fase 4: clientes y CRM

Duracion preliminar: 6 a 12 semanas.

Objetivos:

- Registro de clientes.
- Historial de compras.
- Segmentacion.
- Seguimiento comercial.
- Integracion gradual con WhatsApp.

### Fase 5: multi-sucursal y nube

Duracion preliminar: 8 a 16 semanas.

Objetivos:

- Acceso multi-sucursal seguro.
- Monitoreo.
- Recuperacion ante desastre.
- Arquitectura hibrida o nube si el crecimiento lo justifica.

## 9. Recomendacion final

### Conclusion ejecutiva

Construir un ERP STYLUS propio es factible y estrategicamente valioso, pero no deberia ejecutarse como reemplazo inmediato de Kordata. El riesgo principal no es tecnico; es operativo: migrar inventario, ventas, usuarios y datos sensibles sin interrumpir la operacion.

La alternativa mas razonable es un modelo hibrido por fases. Kordata debe mantenerse como sistema operativo mientras STYLUS construye su base propia, empieza por inventario y catalogo, valida datos por lotes y solo despues avanza hacia ventas, facturacion, clientes y multi-sucursal.

### Estrategia recomendada para STYLUS

Recomendacion:

1. Mantener Kordata como fuente operacional en el corto plazo.
2. Construir ERP STYLUS por fases, iniciando con inventario y productos.
3. Integrar catalogo digital e imagenes antes de mover facturacion.
4. Implementar servidor local con respaldo automatico en nube.
5. Definir desde el inicio seguridad, roles, auditoria y restauracion de backups.
6. Migrar ventas/facturacion solo cuando inventario, usuarios y respaldos esten probados.

Esta ruta permite que STYLUS gane control, independencia e integracion comercial sin poner en riesgo la operacion diaria.
