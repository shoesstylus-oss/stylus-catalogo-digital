# STYLUS Catalogo Digital

Repositorio oficial del proyecto **Catalogo Digital STYLUS**, pensado para presentar productos de Tiendas STYLUS de forma moderna, rapida, editable y compartible con clientes.

## Objetivo

Crear un catalogo digital visualmente atractivo, optimizado para movil, que permita mostrar productos, categorias, imagenes, precios, disponibilidad y contacto directo por WhatsApp.

## Estado actual

### Fase 1

- Catalogo web responsive.
- Vista de productos con imagen, nombre, categoria, tallas y precio.
- Filtros por categoria y busqueda.
- Boton de contacto por WhatsApp.

### Fase 2

- Productos organizados en `src/products.js` con SKU, disponibilidad e imagen.
- Soporte para imagenes cargadas desde `assets/products/`.
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
|   |   |-- stylus-logo.svg
|   |   `-- stylus-mark.svg
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

Las imagenes deben vivir en `assets/products/` y se referencian asi:

```js
image: "assets/products/nombre-del-producto.webp"
```

## Publicacion

Ver [docs/github-pages.md](docs/github-pages.md).
