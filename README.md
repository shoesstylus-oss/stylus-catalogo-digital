# STYLUS Plataforma Comercial

Repositorio oficial de la **Plataforma Comercial STYLUS**, una base web estática, profesional y escalable para presentar productos mayoristas, filtrar colecciones y conectar pedidos por WhatsApp.

## Objetivo

Construir una plataforma comercial moderna para Tiendas STYLUS. El sitio público se mantiene estable en `data/products.json`, mientras la digitalización del Catálogo Maestro Canva STYLUS 2026 avanza en una infraestructura separada dentro de `catalog-data/`.

## Estado actual

### Plataforma pública

- Catálogo web responsive compatible con GitHub Pages.
- Logo oficial cargado desde `assets/logo/`.
- Filtros profesionales por marca, categoría, tallas, color, género, novedades y destacados.
- Búsqueda instantánea con coincidencias resaltadas.
- Tarjetas comerciales Premium con SKU, precio, WhatsApp y Ver más.
- Página individual de producto con galería, descripción, tallas, SKU, compra por WhatsApp y relacionados.
- Preparación PWA con `manifest.json` y `sw.js`.
- SEO, Open Graph, Twitter Cards, `robots.txt` y `sitemap.xml`.

### Etapa 1 de digitalización comercial

- Crea `catalog-data/` como base comercial oficial para digitalizar el Catálogo Maestro Canva STYLUS 2026.
- Organiza el CSV maestro, imágenes pendientes/procesadas, exportaciones y reportes.
- Prepara trabajo por lotes: Lote 01, Lote 02, Lote 03, etc.
- Agrega estados `migration_status`, `image_status` y `quality_score`.
- Genera reportes de resumen, datos faltantes, SKU duplicados y avance.
- Mantiene `data/products.json` sin modificaciones.

## Estructura

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
|-- sw.js
|-- index.html
`-- README.md
```

## Digitalizar productos

Edita `catalog-data/csv/products.master.csv` y ejecuta:

```bash
npm run import:products
```

Este comando genera `catalog-data/exports/products.generated.json` y reportes en `catalog-data/reports/`. No reemplaza el catálogo público.

Para validar sin generar exportación:

```bash
npm run validate:products
```

El comando `npm run publish:products` queda conservado, pero en esta Etapa 1 bloquea la publicación para proteger `data/products.json`.

## Logo oficial

El logotipo oficial de STYLUS vive en `assets/logo/`. Para cambiar el logo en el futuro basta reemplazar los archivos manteniendo los mismos nombres. No se deben usar logos temporales, recreados, redibujados ni generados como placeholder.

## Documentación

Consulta [docs/migracion-canva.md](docs/migracion-canva.md), [docs/migration-dashboard.md](docs/migration-dashboard.md), [docs/carga-productos.md](docs/carga-productos.md), [docs/publicacion.md](docs/publicacion.md), [docs/arquitectura.md](docs/arquitectura.md) y [docs/github-pages.md](docs/github-pages.md).
