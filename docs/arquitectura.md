# Arquitectura del catálogo comercial STYLUS

Este documento describe la estructura actual de la plataforma comercial STYLUS y su base de digitalización comercial.

## Visión general

El proyecto es una aplicación web estática compatible con GitHub Pages. La experiencia pública se divide en:

- `index.html`: catálogo comercial con búsqueda, filtros y tarjetas de producto.
- `pages/product.html`: ficha individual con galería, descripción, tallas, disponibilidad, WhatsApp y productos relacionados.

La información pública se lee desde `data/products.json`. La digitalización del Catálogo Maestro Canva STYLUS 2026 ocurre en `catalog-data/` y no modifica el catálogo público durante la Etapa 1.

## Estructura principal

```text
stylus-catalogo-digital/
|-- assets/
|   |-- logo/
|   `-- products/
|-- catalog-data/
|   |-- csv/
|   |   `-- products.master.csv
|   |-- exports/
|   |   `-- products.generated.json
|   |-- images/
|   |   |-- pending/
|   |   `-- processed/
|   `-- reports/
|       |-- duplicate-skus.md
|       |-- migration-progress.md
|       |-- migration-summary.md
|       `-- missing-data.md
|-- data/
|   |-- i18n.es.json
|   |-- products.json
|   `-- products.template.json
|-- docs/
|   |-- arquitectura.md
|   |-- carga-productos.md
|   |-- migration-dashboard.md
|   |-- migracion-canva.md
|   `-- publicacion.md
|-- pages/
|   `-- product.html
|-- scripts/
|   `-- import-products.mjs
|-- src/
|   |-- components/
|   |-- pages/
|   |-- utils/
|   `-- styles.css
|-- manifest.json
|-- robots.txt
|-- sitemap.xml
|-- sw.js
|-- index.html
`-- README.md
```

## Datos públicos

`data/products.json` es la fuente de lectura de la plataforma. Cada producto incluye identificación, información comercial, precio, estado, etiquetas, imagen, galería y descripción.

Esta etapa no cambia `data/products.json`.

## Base comercial oficial

`catalog-data/csv/products.master.csv` es el archivo maestro para digitalizar productos reales desde Canva por lotes. El importador `scripts/import-products.mjs` transforma ese CSV en `catalog-data/exports/products.generated.json` como borrador.

El CSV incluye:

- Datos de lote: `batch_id`, `batch_name`, `page_range`, `page_start`, `page_end`.
- Datos comerciales del producto.
- `migration_status`: `PENDIENTE`, `EN_REVISION`, `COMPLETO`, `PUBLICADO`.
- `image_status`: `NO_CARGADA`, `PENDIENTE`, `OPTIMIZADA`, `PUBLICADA`.
- `quality_score`: calculado de 0 a 100.

## Reportes

El importador genera:

- `catalog-data/reports/migration-summary.md`.
- `catalog-data/reports/missing-data.md`.
- `catalog-data/reports/duplicate-skus.md`.
- `catalog-data/reports/migration-progress.md`.
- `docs/migration-dashboard.md`.

## Componentes

- `src/components/FilterPanel.js`: filtros por marca, categoría, tallas, color, género, novedades y destacados.
- `src/components/ProductCard.js`: tarjetas comerciales Premium.
- `src/components/ProductDetail.js`: ficha individual con galería y productos relacionados.

## Utilidades

- `src/utils/config.js`: rutas base.
- `src/utils/dom.js`: selectores, escape HTML y normalización.
- `src/utils/filters.js`: filtros y coincidencias.
- `src/utils/format.js`: rutas de imágenes y URLs.
- `src/utils/i18n.js`: textos centralizados.
- `src/utils/products.js`: carga y relación de productos.
- `src/utils/pwa.js`: registro del service worker.
- `src/utils/search.js`: resaltado de coincidencias.
- `src/utils/whatsapp.js`: enlaces WhatsApp.

## Conservación técnica

Se conserva el logo oficial STYLUS en `assets/logo/`, WhatsApp `50589468126`, GitHub Pages, PWA, SEO y accesibilidad.

No se implementa inventario, ERP, API, login, carrito, checkout, panel administrativo ni base de datos externa.
