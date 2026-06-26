# STYLUS Catálogo Digital

Repositorio oficial del proyecto **Catálogo Digital STYLUS**, pensado para presentar productos de Tiendas STYLUS de forma moderna, rápida, editable y compartible con clientes.

## Objetivo

Crear un catálogo digital visualmente atractivo, optimizado para móvil, que permita mostrar productos, categorías, imágenes, precios, disponibilidad y contacto directo por WhatsApp.

## Estado actual

### Fase 1

- Catálogo web responsive.
- Vista de productos con imagen, nombre, categoría, tallas y precio.
- Filtros por categoría y búsqueda.
- Botón de contacto por WhatsApp.

### Fase 2

- Productos organizados en `src/products.js` con SKU, disponibilidad e imagen.
- Soporte para imágenes cargadas desde `assets/products/`.
- Logo y marca cargados desde `assets/logo/`.
- Fallback visual cuando una imagen de producto no existe o no carga.
- Mejora visual de identidad STYLUS.
- Workflow listo para publicar con GitHub Pages.

## Estructura

```text
stylus-catalogo-digital/
|-- .github/
|   `-- workflows/
|       `-- pages.yml
|-- assets/
|   |-- logo/
|   |   |-- favicon.png
|   |   |-- stylus-icon.png
|   |   |-- stylus-logo-horizontal.png
|   |   `-- stylus-logo.png
|   `-- products/
|-- docs/
|   `-- github-pages.md
|-- src/
|   |-- app.js
|   |-- products.js
|   `-- styles.css
|-- .nojekyll
|-- index.html
`-- README.md
```

## Actualizar productos

Edita `src/products.js`. Cada producto puede definir:

- `sku`
- `name`
- `category`
- `price`
- `sizes`
- `availability`
- `image`
- `description`

Las imágenes deben vivir en `assets/products/` y se referencian así:

```js
image: "assets/products/nombre-del-producto.webp"
```

## Logo oficial

El logotipo oficial de STYLUS vive en `assets/logo/`. La interfaz usa estos archivos:

- `stylus-logo.png`: copia fuente del logotipo oficial.
- `stylus-logo-horizontal.png`: versión horizontal recortada desde el archivo oficial para el encabezado.
- `stylus-icon.png`: ícono recortado desde el monograma oficial.
- `favicon.png`: versión del ícono para navegador.

Para cambiar el logo en el futuro basta reemplazar esos archivos manteniendo los mismos nombres. No se deben usar logos temporales, recreados, redibujados ni generados como placeholder.

## Publicación

Ver [docs/github-pages.md](docs/github-pages.md).
