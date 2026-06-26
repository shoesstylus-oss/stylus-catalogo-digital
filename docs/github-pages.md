# Publicacion con GitHub Pages

Este catalogo esta preparado como sitio estatico: `index.html`, `src/`, `assets/` y archivos de configuracion.

## Activar Pages

1. En GitHub, entra a **Settings > Pages**.
2. En **Build and deployment**, selecciona **GitHub Actions**.
3. Al fusionar cambios en `main`, el workflow `.github/workflows/pages.yml` publicara el catalogo.

## Cargar imagenes reales

1. Sube fotos optimizadas a `assets/products/`.
2. Usa nombres simples en minuscula, por ejemplo `tenis-runner-negro.webp`.
3. En `src/products.js`, actualiza la propiedad `image` del producto:

```js
image: "assets/products/tenis-runner-negro.webp"
```

Si una imagen no carga, el catalogo usa un fallback visual generado por JavaScript para que la tarjeta no quede rota.

## Actualizar logo oficial

1. Reemplaza `assets/logo/stylus-logo.svg` por el logo oficial final.
2. Reemplaza `assets/logo/stylus-mark.svg` por el isotipo o favicon oficial.
3. Conserva los mismos nombres de archivo para no editar el HTML.

## Recomendaciones de imagen

- Productos: `1200x900`, formato `.webp` o `.jpg`, menos de 300 KB por imagen.
- Logo horizontal: SVG o PNG transparente.
- Isotipo/favicon: SVG cuadrado o PNG `512x512`.
