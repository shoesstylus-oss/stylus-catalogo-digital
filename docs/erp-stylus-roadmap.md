# ERP STYLUS - Roadmap por fases

Este roadmap propone una ruta gradual para construir un sistema propio STYLUS de inventario, facturacion y catalogo digital. La prioridad es reducir riesgo: primero arquitectura y datos confiables, luego operacion, y despues automatizacion comercial.

## Principios

- No reemplazar Kordata hasta validar datos y procesos.
- No publicar productos automaticamente.
- Mantener estable el catalogo publico actual.
- Separar datos reales operativos de muestras versionadas.
- Construir modulos pequenos, auditables y verificables.
- Respaldar antes de migraciones, importaciones masivas y publicaciones.

## Fase 0 - Arquitectura

Objetivo: definir la base tecnica antes de implementar.

Alcance:

- Arquitectura servidor local + nube.
- Estrategia de respaldo.
- Modulos futuros.
- Riesgos y mitigaciones.
- Criterios de seguridad.
- Roadmap de migracion desde Kordata.

Entregables:

- Documento de arquitectura.
- Documento de respaldo cloud.
- Roadmap por fases.
- Decision tecnica inicial para base de datos, backend, frontend e imagenes.

Criterio de salida:

- STYLUS aprueba la direccion tecnica.
- Se define quien administrara servidor, respaldos y accesos.
- Se acuerda que datos reales sensibles no se versionan en el repositorio.

## Fase 1 - Inventario

Objetivo: crear el nucleo confiable de productos y existencias.

Alcance:

- Base de datos PostgreSQL.
- Modelo de productos, modelos, variantes, tallas y colores.
- Existencia por sucursal.
- Movimientos de inventario.
- Importacion controlada desde Kordata.
- Reportes de diferencias y validacion.
- Usuarios iniciales y roles basicos.

Modulos:

- Inventario.
- Usuarios y permisos iniciales.
- Reportes de inventario.

Entregables:

- Backend interno para inventario.
- Pantalla de busqueda de productos.
- Pantalla de existencia por sucursal.
- Reporte de bajo stock.
- Auditoria basica de movimientos.

Criterio de salida:

- Inventario importado y conciliado por lotes.
- Diferencias contra Kordata documentadas.
- Backups diarios activos y probados.

## Fase 2 - Imagenes y catalogo

Objetivo: conectar inventario con presentacion comercial.

Alcance:

- Gestor de imagenes.
- Imagen principal y galeria por producto/modelo.
- Estado de imagen: pendiente, asignada, revisar, aprobada, rechazada.
- Enriquecimiento comercial.
- Preview de catalogo.
- Publicacion controlada hacia catalogo web.

Modulos:

- Catalogo digital.
- Imagenes.
- Reportes de calidad.
- WhatsApp basico por producto.

Entregables:

- Panel de productos listos para publicar.
- Reporte de productos sin imagen.
- Reporte de productos incompletos.
- Exportacion publicable validada.

Criterio de salida:

- Solo productos completos aparecen como publicables.
- Preview revisado antes de publicacion.
- No se rompe GitHub Pages, PWA, SEO ni WhatsApp.

## Fase 3 - Ventas y facturacion

Objetivo: manejar ventas y documentos comerciales desde el ERP.

Alcance:

- Registro de ventas.
- Facturacion.
- Anulaciones.
- Metodos de pago.
- Corte diario.
- Descuento de inventario por venta.
- Auditoria de operaciones.

Modulos:

- Ventas.
- Facturacion.
- Caja/corte.
- Reportes de venta.

Entregables:

- Pantalla de venta.
- Factura o comprobante segun requerimiento legal/comercial.
- Reportes por fecha, sucursal, vendedor, marca y categoria.
- Control de anulaciones con permisos.

Criterio de salida:

- Ventas conciliadas con inventario.
- Usuarios y permisos operativos.
- Backups probados antes de operar en produccion.

## Fase 4 - Clientes y CRM

Objetivo: convertir ventas e interacciones en relacion comercial.

Alcance:

- Registro de clientes.
- Historial de compras.
- Segmentacion mayorista/minorista.
- Seguimiento de clientes.
- Leads desde catalogo y WhatsApp.
- Preferencias y notas comerciales.

Modulos:

- Clientes.
- CRM.
- WhatsApp comercial.
- Reportes de seguimiento.

Entregables:

- Ficha de cliente.
- Historial de compras.
- Reporte de clientes frecuentes.
- Seguimiento de oportunidades.

Criterio de salida:

- STYLUS puede identificar clientes clave y oportunidades.
- Consultas desde catalogo pueden relacionarse con productos y clientes.

## Fase 5 - Nube y multi-sucursal

Objetivo: escalar operacion con mayor disponibilidad y acceso multi-sucursal.

Alcance:

- Acceso seguro desde sucursales.
- Replicacion o despliegue hibrido.
- Mejoras de disponibilidad.
- Monitoreo centralizado.
- Respaldo avanzado.
- Evaluacion de mover backend a nube si conviene.

Modulos:

- Multi-sucursal.
- Monitoreo.
- Seguridad avanzada.
- Integraciones externas.

Entregables:

- Acceso remoto seguro.
- Monitoreo de servidor y backups.
- Plan de continuidad operacional.
- Procedimiento de recuperacion ante desastre.

Criterio de salida:

- Sucursales operan con acceso controlado.
- STYLUS puede recuperarse ante fallo del servidor local.
- La nube respalda o soporta operacion segun necesidad real.

## Dependencias entre fases

```text
Fase 0 Arquitectura
  -> Fase 1 Inventario
  -> Fase 2 Imagenes y catalogo
  -> Fase 3 Ventas/facturacion
  -> Fase 4 Clientes/CRM
  -> Fase 5 Nube y multi-sucursal
```

La Fase 2 puede avanzar parcialmente en paralelo con Fase 1 si ya existe una base confiable de productos. La Fase 3 no deberia operar en produccion sin inventario conciliado y respaldos verificados.

## Riesgos por fase

| Fase | Riesgo | Mitigacion |
| --- | --- | --- |
| 0 | Arquitectura demasiado compleja | Disenar minimo viable y crecer por fases |
| 1 | Inventario no coincide con Kordata | Conciliacion por lotes y reportes de diferencias |
| 2 | Productos incompletos publicados | Reglas estrictas de publicacion y preview |
| 3 | Ventas descuentan mal inventario | Transacciones, auditoria y pruebas con escenarios reales |
| 4 | Datos de clientes inconsistentes | Validaciones y deduplicacion |
| 5 | Acceso remoto inseguro | VPN/HTTPS, MFA, roles y monitoreo |

## Recomendacion de ejecucion

El primer prototipo tecnico despues de Fase 0 deberia ser Fase 1 Inventario: productos, variantes, existencia por sucursal, movimientos y reportes. Ese nucleo reduce la dependencia de Kordata gradualmente y prepara el camino para imagenes, catalogo, ventas y multi-sucursal sin forzar una migracion brusca.
