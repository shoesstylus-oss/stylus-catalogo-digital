# Fase 3 - Plataforma Comercial STYLUS

## Resumen

La Fase 3 transforma el catálogo en la primera versión de una plataforma comercial modular. El proyecto sigue siendo estático para conservar compatibilidad con GitHub Pages, pero queda organizado como base escalable para funciones futuras.

## Cambios principales

- `data/products.json` reemplaza a `src/products.js` como fuente de productos.
- `data/i18n.es.json` centraliza cadenas de interfaz para internacionalización futura.
- `src/components/` contiene componentes de filtros, tarjetas y detalle de producto.
- `src/pages/` contiene controladores de página para catálogo y producto.
- `src/utils/` contiene utilidades de datos, filtros, búsqueda, rutas, WhatsApp, PWA y traducciones.
- `pages/product.html` agrega la página individual de producto.
- `manifest.json` y `sw.js` dejan la base PWA preparada sin romper GitHub Pages.

## Filtros disponibles

- Marca
- Categoría
- Tallas
- Color
- Género
- Novedades
- Destacados

## Búsqueda

La búsqueda es instantánea, no recarga la página y resalta coincidencias en marca, nombre, SKU y descripción.

## Tarjetas comerciales

Cada tarjeta muestra imagen, marca, nombre, SKU, precio, precio mayorista, etiquetas de Nuevo/Destacado, botón de WhatsApp y botón Ver más.

## Página individual

La página `pages/product.html?id={id}` muestra galería, descripción, tallas, SKU, estado, compra por WhatsApp y productos relacionados.

## PWA

La preparación PWA incluye:

- `manifest.json`
- iconos desde `assets/logo/`
- `sw.js` con caché básico del shell de la aplicación

## No incluido todavía

No se implementan inventario, login, carrito, base de datos remota, panel administrativo ni ERP.
