# Publicación con GitHub Pages

Este catálogo está preparado como sitio estático: `index.html`, `src/`, `assets/` y archivos de configuración.

## Activar Pages

1. En GitHub, entra a **Settings > Pages**.
2. En **Build and deployment**, selecciona **GitHub Actions**.
3. Al fusionar cambios en `main`, el workflow `.github/workflows/pages.yml` publicará el catálogo.

## Cargar imágenes reales

1. Sube fotos optimizadas a `assets/products/`.
2. Usa nombres simples en minúscula, por ejemplo `tenis-runner-negro.webp`.
3. En `src/products.js`, actualiza la propiedad `image` del producto:

```js
image: "assets/products/tenis-runner-negro.webp"
```

Si una imagen no carga, el catálogo usa un fallback visual generado por JavaScript para que la tarjeta no quede rota.

## Actualizar logo oficial

El logotipo oficial de STYLUS vive en `assets/logo/`:

- `stylus-logo.png`
- `stylus-logo-horizontal.png`
- `stylus-icon.png`
- `favicon.png`

Para cambiar el logo en el futuro basta reemplazar esos archivos manteniendo los mismos nombres. No se deben usar logos temporales, recreados, redibujados ni generados como placeholder.

## Recomendaciones de imagen

- Productos: `1200x900`, formato `.webp` o `.jpg`, menos de 300 KB por imagen.
- Logo horizontal: PNG derivado del archivo oficial.
- Ícono/favicon: PNG cuadrado derivado del archivo oficial.
