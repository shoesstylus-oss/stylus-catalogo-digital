# ERP STYLUS - Arquitectura servidor local + nube

Este documento define la arquitectura base para un futuro sistema propio STYLUS de inventario, facturacion y catalogo digital. Es una propuesta de Fase 0: no implementa cambios, no modifica el catalogo actual y no reemplaza ningun flujo operativo existente.

## Objetivos de arquitectura

- Operar el sistema principal desde un servidor local controlado por STYLUS.
- Mantener una base de datos central para inventario, ventas, clientes, proveedores y catalogo.
- Guardar imagenes de producto en almacenamiento administrado y respaldado.
- Sincronizar respaldos automaticos hacia la nube.
- Permitir acceso seguro desde sucursales y usuarios autorizados.
- Mantener el catalogo web como salida publica controlada, sin publicar cambios automaticamente.

## Vista general

```text
Sucursales / usuarios autorizados
        |
        | VPN / HTTPS privado
        v
Servidor local STYLUS
        |
        |-- Backend ERP
        |-- Base de datos central
        |-- Almacenamiento local de imagenes/cache
        |-- Jobs de respaldo y exportacion
        |
        +--> Respaldo nube
        |
        +--> Catalogo web publico
```

## Componentes principales

### Servidor local

El servidor local debe ser el punto central de operacion diaria. Puede vivir fisicamente en oficina central o en una ubicacion con energia, internet y control fisico confiables.

Responsabilidades:

- Ejecutar backend ERP.
- Alojar base de datos principal.
- Guardar archivos operativos y cache de imagenes.
- Ejecutar tareas programadas de respaldo.
- Servir la aplicacion interna para usuarios autorizados.
- Generar exportaciones para catalogo digital.

Recomendacion inicial:

- Equipo dedicado, no una computadora de uso diario.
- Disco SSD principal y disco secundario para respaldo local.
- UPS para cortes electricos.
- Acceso remoto solo por VPN o canal seguro.
- Monitoreo basico de disco, memoria, CPU y respaldos.

### Base de datos

Recomendacion: PostgreSQL.

Motivos:

- Base relacional robusta para inventario, ventas, facturacion y reportes.
- Soporta transacciones confiables.
- Tiene herramientas maduras de respaldo y restauracion.
- Escala bien desde servidor local hacia nube o arquitectura hibrida.

Dominios iniciales sugeridos:

- Productos, modelos, variantes, tallas y colores.
- Existencia por sucursal.
- Movimientos de inventario.
- Compras y proveedores.
- Ventas, facturas y anulaciones.
- Clientes.
- Usuarios, roles y permisos.
- Auditoria de cambios.
- Publicacion de catalogo.

### Backend

Recomendacion: Node.js con API REST interna, usando un framework estable como Fastify, NestJS o Express con estructura modular.

Responsabilidades:

- Validar reglas de negocio.
- Exponer operaciones internas para inventario, ventas, compras y catalogo.
- Controlar permisos por usuario.
- Registrar auditoria de movimientos.
- Generar reportes y exportaciones.
- Integrarse con WhatsApp, catalogo web y futuras herramientas.

Principios:

- Toda modificacion critica debe quedar auditada.
- Ningun modulo debe escribir directamente en archivos publicos sin validacion.
- Los procesos de publicacion deben ser explicitamente aprobados.

### Frontend interno

Recomendacion: aplicacion web interna responsive.

Puede construirse con React, Vue o una alternativa ligera segun el equipo que mantendra el sistema.

Vistas iniciales:

- Dashboard de inventario.
- Busqueda de productos.
- Existencia por sucursal.
- Movimientos.
- Carga y revision de imagenes.
- Usuarios y permisos.
- Reportes.
- Cola de productos listos para catalogo.

### Almacenamiento de imagenes

La arquitectura debe separar:

- Imagen original recibida o capturada.
- Imagen revisada/aprobada para catalogo.
- Miniaturas optimizadas.
- URL publica o privada segun uso.

Opciones recomendadas:

- Local: carpeta administrada en el servidor con respaldo automatico.
- Nube: Azure Blob Storage, S3 compatible o Backblaze B2 para copia y entrega publica.

Regla operativa:

- Las imagenes propias de productos estrategicos deben preferirse sobre imagenes heredadas de Kordata.
- Las URLs de Kordata/Azure pueden usarse como fuente inicial, pero deben pasar por revision visual antes de publicarse masivamente.

### Catalogo web

El catalogo publico actual debe seguir siendo una salida controlada.

Flujo sugerido:

```text
ERP interno
  -> productos publicables
  -> preview
  -> revision comercial
  -> publicacion controlada
  -> data/products.json o API publica futura
```

Principios:

- No publicar automaticamente.
- No publicar productos sin imagen.
- No publicar productos sin disponibilidad.
- No publicar productos incompletos.
- Mantener compatibilidad con GitHub Pages, PWA, SEO y WhatsApp mientras el catalogo actual siga vigente.

### Acceso desde sucursales

Opciones:

- VPN hacia servidor local.
- Acceso HTTPS privado con autenticacion fuerte.
- Terminales internas conectadas por red segura.
- Futuro modo nube/hibrido para sucursales remotas.

Recomendacion para Fase 1:

- Usuarios con roles.
- Acceso por navegador.
- Registro de sesion y auditoria.
- Politica de contrasenas.
- Copias de seguridad verificadas antes de abrir operacion multi-sucursal.

## Modulos futuros

### Inventario

- Productos, variantes, tallas y colores.
- Existencia por sucursal.
- Entradas, salidas, ajustes y transferencias.
- Reservas.
- Alertas de bajo stock.
- Kardex por producto.

### Facturacion

- Ventas.
- Facturas.
- Anulaciones.
- Metodos de pago.
- Corte diario.
- Exportes contables o fiscales si aplica.

### Compras

- Ordenes de compra.
- Recepcion de mercaderia.
- Costos historicos.
- Proveedores.
- Comparacion costo/precio/margen.

### Clientes

- Historial de compras.
- Datos de contacto.
- Segmentacion mayorista/minorista.
- Seguimiento comercial.

### Proveedores

- Datos comerciales.
- Historial de compras.
- Condiciones de pago.
- Productos relacionados.

### Reportes

- Inventario por sucursal.
- Rotacion.
- Margenes.
- Bajo stock.
- Productos sin imagen.
- Productos listos para catalogo.
- Ventas por periodo, marca, categoria y sucursal.

### Usuarios y permisos

- Roles por area.
- Permisos por modulo.
- Auditoria de operaciones criticas.
- Bloqueo o desactivacion de usuarios.

### Catalogo digital

- Enriquecimiento comercial.
- Imagen principal y galeria.
- Estado de publicacion.
- Preview antes de publicar.
- Integracion con WhatsApp.

### WhatsApp

- Enlaces de consulta por producto.
- Plantillas de mensajes.
- Registro futuro de leads.
- Integracion gradual con WhatsApp Business si STYLUS decide avanzar.

## Recomendacion tecnologica

| Capa | Recomendacion | Justificacion |
| --- | --- | --- |
| Base de datos | PostgreSQL | Transaccional, confiable, portable y con respaldos maduros |
| Backend | Node.js con Fastify/NestJS/Express modular | Buen encaje con el catalogo actual y automatizaciones existentes |
| Frontend interno | React o Vue | Interfaz web mantenible para escritorio y tablets |
| Catalogo publico | Mantener sitio actual inicialmente | Reduce riesgo y protege GitHub Pages, SEO, PWA y WhatsApp |
| Imagenes | Almacenamiento local + copia nube | Control local con respaldo externo |
| Backups | pg_dump, snapshots y copia cifrada nube | Recuperacion ante fallos y errores humanos |
| Seguridad | VPN/HTTPS, roles, auditoria, backups cifrados | Protege operacion multiusuario y datos comerciales |

## Principios de seguridad

- Autenticacion obligatoria para el ERP.
- Roles por modulo y sucursal.
- Auditoria de inventario, compras, ventas y publicacion.
- Respaldos cifrados.
- Pruebas de restauracion periodicas.
- Sin credenciales en repositorios.
- Separar datos reales operativos de muestras versionadas.

## Riesgos principales

### Perdida de datos

Mitigacion:

- Backups automaticos diarios.
- Backups incrementales o WAL si la operacion lo requiere.
- Copia local y copia nube.
- Pruebas de restauracion mensuales.

### Fallos del servidor local

Mitigacion:

- UPS.
- Disco secundario.
- Monitoreo.
- Plan de restauracion en equipo alterno.
- Imagen o procedimiento documentado de recuperacion.

### Seguridad

Mitigacion:

- Acceso remoto por VPN o HTTPS con certificados.
- Usuarios nominales.
- Permisos minimos necesarios.
- Logs de auditoria.
- Actualizaciones planificadas.

### Respaldo insuficiente

Mitigacion:

- Retencion por dias, semanas y meses.
- Alertas de backup fallido.
- Restauracion de prueba.
- Copias fuera del sitio.

### Migracion desde Kordata

Mitigacion:

- Mantener Kordata como fuente durante transicion.
- Importar primero inventario y productos.
- Validar diferencias por lotes.
- No reemplazar procesos de venta hasta tener conciliacion.
- Evitar subir exportaciones completas sensibles al repositorio.

## Decision recomendada para Fase 0

Avanzar con una arquitectura hibrida: servidor local como sistema principal, PostgreSQL como base de datos, backend modular en Node.js, imagenes administradas con copia nube, y catalogo web como salida publicable controlada. Esta estrategia protege la operacion actual y permite crecer por fases sin romper el catalogo publico existente.
