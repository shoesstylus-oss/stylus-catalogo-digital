# Arquitectura del catálogo comercial STYLUS

Este documento describe la estructura actual del proyecto y cómo se organiza la plataforma comercial STYLUS para trabajar con productos reales sin agregar todavía inventario, login, carrito, checkout, ERP ni base de datos externa.

## Visión general

El proyecto es una aplicación web estática compatible con GitHub Pages. La experiencia se divide en dos pantallas:

- `index.html`: catálogo comercial con búsqueda, filtros y tarjetas de producto.
- `pages/product.html`: ficha individual de producto con galería, descripción, tallas, disponibilidad, WhatsApp y productos relacionados.

La información comercial se carga desde archivos JSON locales y las imágenes viven dentro del repositorio.
Desde la Fase 6, `data/products.json` se puede generar desde `data/import/products.master.csv` usando el importador local.

## Estructura principal

```text
stylus-catalogo-digital/
|-- assets/
|   |-- logo/
|   `-- products/
|-- data/
|   |-- import/
|   |-- i18n.es.json
|   |-- products.json
|   `-- products.template.json
|-- docs/
|   |-- arquitectura.md
|   |-- carga-productos.md
|   |-- fase-3.md
|   |-- github-pages.md
|   |-- migracion-canva.md
|   `-- publicacion.md
|-- pages/
|   `-- product.html
|-- reports/
|   |-- import-report.json
|   `-- import-report.md
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

## Datos

`data/import/products.master.csv` es la fuente maestra recomendada para cargas reales. El script `scripts/import-products.mjs` transforma el CSV en `data/products.json`.

`data/products.json` es la fuente de lectura de la plataforma. Cada producto incluye:

- Identificación: `id`, `sku`.
- Información comercial: `nombre`, `marca`, `categoría`, `género`, `color`, `colores`, `tallas`.
- Venta: `precio`, `precio_mayorista`, `estado`, `nuevo`, `destacado`.
- Contenido: `imagen`, `galería`, `descripción`.

El importador también genera reportes en `reports/` para detectar SKU duplicados, campos pendientes e imágenes faltantes antes de publicar.

Las categorías comerciales actuales son:

- Calzado Deportivo
- Calzado Casual
- Ropa Deportiva
- Accesorios

Las marcas preparadas para filtros son:

- Nike
- Adidas
- New Balance
- Puma
- Reebok
- Under Armour
- STYLUS
- Otras

## Componentes

`src/components/FilterPanel.js`

Renderiza los filtros por marca, categoría, tallas, color, género, novedades y destacados. También renderiza chips de filtros activos.

`src/components/ProductCard.js`

Renderiza las tarjetas comerciales Premium con imagen, marca, nombre, SKU, descripción, precio, precio mayorista, estado, colores, etiquetas, WhatsApp y Ver más.

`src/components/ProductDetail.js`

Renderiza la ficha individual con galería, descripción, SKU, categoría, tallas, colores, género, disponibilidad, precio, compra por WhatsApp y productos relacionados.

## Páginas JavaScript

`src/pages/catalogPage.js`

Inicializa el catálogo, carga textos y productos, actualiza métricas, controla búsqueda instantánea, filtros y renderizado de tarjetas.

`src/pages/productPage.js`

Lee el `id` del producto desde la URL, renderiza la ficha individual, actualiza metadatos SEO del producto y agrega datos estructurados JSON-LD.

## Utilidades

- `src/utils/config.js`: rutas base para catálogo y página de producto.
- `src/utils/dom.js`: selectores, escape HTML y normalización de texto.
- `src/utils/filters.js`: definición de filtros y lógica de coincidencias.
- `src/utils/format.js`: rutas de imágenes y URLs de producto.
- `src/utils/i18n.js`: carga de textos centralizados.
- `src/utils/products.js`: carga, búsqueda por ID y relacionados.
- `src/utils/pwa.js`: registro del service worker.
- `src/utils/search.js`: resaltado de coincidencias.
- `src/utils/whatsapp.js`: generación de enlaces WhatsApp.

## Assets

`assets/logo/`

Contiene el logotipo oficial STYLUS. No se deben usar logos recreados ni temporales.

`assets/products/`

Contiene imágenes de producto. Para producción se recomienda usar `.webp`, nombres en minúsculas y archivos optimizados.

## SEO y publicación

El catálogo incluye:

- Meta title y meta description.
- Open Graph.
- Twitter Cards.
- JSON-LD para sitio y producto.
- `robots.txt`.
- `sitemap.xml` preparado.
- `manifest.json`.
- `sw.js`.

La publicación se realiza con `.github/workflows/pages.yml` cuando GitHub Pages está configurado para usar GitHub Actions.

## Límites de esta fase

La plataforma sigue siendo estática. No se implementan inventario en tiempo real, login, carrito, checkout, ERP, base de datos externa ni panel administrativo.
