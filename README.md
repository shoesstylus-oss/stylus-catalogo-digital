# STYLUS Plataforma Comercial

Repositorio oficial de la **Plataforma Comercial STYLUS**, una base web estática, profesional y escalable para presentar productos mayoristas, filtrar colecciones y conectar pedidos por WhatsApp.

## Objetivo

Construir una plataforma comercial moderna para Tiendas STYLUS. La Fase 3 deja de tratar el proyecto como un catálogo aislado y lo organiza como una aplicación modular preparada para futuras funciones comerciales.

## Estado actual

### Fase 1

- Catálogo web responsive.
- Vista de productos con imagen, nombre, categoría, tallas y precio.
- Filtros por categoría y búsqueda.
- Botón de contacto por WhatsApp.

### Fase 2

- Soporte para imágenes cargadas desde `assets/products/`.
- Logo oficial cargado desde `assets/logo/`.
- Preparación para publicar con GitHub Pages.

### Fase 3

- Reestructura modular en `src/components/`, `src/pages/`, `src/utils/`, `data/`, `pages/` y `assets/`.
- Migra productos a `data/products.json`.
- Agrega filtros profesionales por marca, categoría, tallas, color, género, novedades y destacados.
- Agrega búsqueda instantánea con coincidencias resaltadas.
- Agrega tarjetas comerciales Premium con etiquetas, SKU, precio, WhatsApp y Ver más.
- Agrega página individual de producto con galería, descripción, tallas, SKU, compra por WhatsApp y relacionados.
- Agrega preparación PWA con `manifest.json` y `sw.js`.
- Centraliza cadenas de interfaz en `data/i18n.es.json`.

### Fase 5

- Organiza el catálogo comercial en Calzado Deportivo, Calzado Casual, Ropa Deportiva y Accesorios.
- Prepara marcas comerciales para filtros: Nike, Adidas, New Balance, Puma, Reebok, Under Armour, STYLUS y Otras.
- Mejora presentación visual, SEO, accesibilidad y rendimiento sin agregar funciones de carrito, login ni inventario.

## Estructura

```text
stylus-catalogo-digital/
|-- assets/
|   |-- logo/
|   `-- products/
|-- data/
|   |-- i18n.es.json
|   `-- products.json
|-- docs/
|   |-- arquitectura.md
|   |-- fase-3.md
|   `-- github-pages.md
|-- pages/
|   `-- product.html
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

## Actualizar productos

Edita `data/products.json`. Cada producto debe incluir:

- `id`
- `sku`
- `nombre`
- `marca`
- `categoría`
- `género`
- `color`
- `tallas`
- `precio`
- `precio_mayorista`
- `estado`
- `nuevo`
- `destacado`
- `imagen`
- `descripción`

Las imágenes deben vivir en `assets/products/` y se referencian así:

```json
"imagen": "assets/products/nombre-del-producto.webp"
```

## Logo oficial

El logotipo oficial de STYLUS vive en `assets/logo/`. Para cambiar el logo en el futuro basta reemplazar los archivos manteniendo los mismos nombres. No se deben usar logos temporales, recreados, redibujados ni generados como placeholder.

## Publicación

Ver [docs/publicacion.md](docs/publicacion.md), [docs/carga-productos.md](docs/carga-productos.md), [docs/github-pages.md](docs/github-pages.md) y [docs/fase-3.md](docs/fase-3.md).
