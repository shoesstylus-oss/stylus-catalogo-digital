# Publicación y verificación STYLUS

Esta guía documenta la verificación de Fase 4 y los pasos necesarios para publicar la plataforma comercial STYLUS con GitHub Pages.

## Estado de main

La rama `main` contiene la Fase 3 fusionada y sirve como fuente de publicación. La plataforma mantiene:

- Catálogo inicial en `index.html`.
- Página individual en `pages/product.html`.
- Productos en `data/products.json`.
- Textos centralizados en `data/i18n.es.json`.
- Logo oficial en `assets/logo/`.
- Imágenes de productos en `assets/products/`.
- PWA preparada con `manifest.json` y `sw.js`.

## Verificación funcional

Antes de publicar o después de fusionar cambios en `main`, revisa:

- La carga inicial del catálogo muestra productos.
- El logo oficial STYLUS carga desde `assets/logo/stylus-logo-horizontal.png`.
- Los filtros por marca, categoría, tallas, color, género, novedades y destacados funcionan.
- La búsqueda instantánea filtra resultados y resalta coincidencias.
- Las tarjetas Premium muestran imagen, marca, nombre, SKU, precio, etiquetas, WhatsApp y Ver más.
- Todos los enlaces de WhatsApp usan `50589468126`.
- La página individual abre con `pages/product.html?id={id}`.
- La página individual muestra galería, descripción, tallas, SKU, compra por WhatsApp y relacionados.
- `manifest.json` responde desde la raíz del sitio.
- `sw.js` responde desde la raíz del sitio.
- Las rutas son relativas y compatibles con GitHub Pages.

## Workflow de GitHub Pages

El archivo `.github/workflows/pages.yml` está configurado para publicar el sitio estático desde `main`.

Puntos confirmados del workflow:

- Se ejecuta con `push` a `main`.
- Permite ejecución manual con `workflow_dispatch`.
- Usa `actions/checkout@v4`.
- Usa `actions/configure-pages@v5`.
- Sube el sitio completo como artefacto con `actions/upload-pages-artifact@v3`.
- Publica con `actions/deploy-pages@v4`.
- Usa el entorno `github-pages`.

## Estado actual de GitHub Actions

Se revisó el último run de `main` para el commit `8e944aa`.

- Workflow: `Deploy static catalog to GitHub Pages`.
- Evento: `push`.
- Rama: `main`.
- Resultado: falló en el paso `Configure Pages`.
- Causa reportada por GitHub Actions: Pages todavía no está habilitado o no está configurado para compilar usando GitHub Actions.
- Run revisado: `https://github.com/shoesstylus-oss/stylus-catalogo-digital/actions/runs/28218296823`.

El workflow está preparado correctamente, pero requiere activar GitHub Pages en la configuración del repositorio antes de que el despliegue pueda completarse.

## Activación manual requerida

Si GitHub Pages todavía no está activo en el repositorio, se debe configurar manualmente una sola vez:

1. Abrir el repositorio en GitHub.
2. Entrar a **Settings > Pages**.
3. En **Build and deployment**, elegir **GitHub Actions**.
4. Guardar la configuración si GitHub lo solicita.
5. Fusionar un cambio en `main` o ejecutar el workflow manualmente desde **Actions**.

Después de esa activación, cada push a `main` debe publicar automáticamente.

No se recomienda intentar activar Pages automáticamente con `actions/configure-pages` usando solamente `GITHUB_TOKEN`, porque la propia acción requiere un token adicional con permisos de administración y Pages para ese modo.

## Revisión post-publicación

Cuando Pages entregue una URL pública, valida:

- La URL principal abre el catálogo.
- La URL `pages/product.html?id=tenis-deportivo-hombre` abre una ficha de producto.
- El logo oficial se ve correctamente en escritorio, tablet y móvil.
- No hay imágenes rotas visibles.
- WhatsApp apunta a `https://wa.me/50589468126`.
- `manifest.json` y `sw.js` responden con estado 200.

## Alcance no incluido

Esta fase no implementa panel administrativo, login, carrito, inventario en tiempo real, ERP ni base de datos externa.
