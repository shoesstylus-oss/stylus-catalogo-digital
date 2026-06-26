# Gestor de imagenes STYLUS

El Gestor de Imagenes STYLUS permite asociar imagenes al catalogo enriquecido desde dos fuentes:

- URLs existentes de Kordata o Azure Blob Storage.
- Imagenes manuales cargadas por STYLUS en el repositorio.

No descarga imagenes, no conecta API, no usa credenciales y no publica automaticamente.

## Archivos principales

- Mapa de imagenes: `catalog-data/images/image-map.csv`
- Carpeta para imagenes manuales: `assets/products/stylus/`
- Motor que resuelve imagenes: `integrations/stylus/enrich-products.mjs`
- Salida enriquecida: `catalog-data/exports/stylus-products.enriched.json`

## Columnas de image-map.csv

```text
modelo,marca,color,sku,image_source,image_url,local_path,gallery,image_status,notas
```

Uso recomendado:

- `modelo`, `marca`, `color`: identifican el producto comercial cuando no se usa SKU.
- `sku`: permite asociar una imagen a una variante puntual cuando Kordata trae SKU.
- `image_source`: usa `kordata`, `azure_blob` o `manual`.
- `image_url`: URL existente de Kordata/Azure Blob Storage.
- `local_path`: ruta local versionada, por ejemplo `assets/products/stylus/urb-100-blanco.jpg`.
- `gallery`: imagenes separadas con `|`.
- `image_status`: estado operativo como `PENDIENTE`, `ASIGNADA`, `REVISAR`, `APROBADA`.
- `notas`: observaciones internas.

## Prioridad de imagenes

El motor de enriquecimiento resuelve la imagen principal en este orden:

1. `imagen_principal` en `catalog-data/enrichment/products.enrichment.csv`.
2. `local_path` en `catalog-data/images/image-map.csv`.
3. `image_url` en `catalog-data/images/image-map.csv`.
4. Si no hay imagen, el producto queda sin `imagen_principal` y no es publicable.

## Reportes

Al ejecutar:

```bash
npm run enrich:products
```

se generan:

- `catalog-data/reports/images-summary.md`
- `catalog-data/reports/images-missing.md`
- `catalog-data/reports/images-from-kordata.md`
- `catalog-data/reports/images-manual.md`

## Imagenes manuales STYLUS

Guarda imagenes manuales aprobadas en:

```text
assets/products/stylus/
```

Luego referencia la ruta en `local_path`. No uses archivos temporales, rutas locales de una computadora personal ni enlaces privados.

## Imagenes desde Kordata/Azure

Si Kordata ya contiene una URL publica o apta para catalogo, registrala en `image_url` y marca `image_source` como `kordata` o `azure_blob`. No guardes credenciales, SAS tokens privados ni URLs temporales sensibles.

## Seguridad

Este modulo no modifica:

- `data/products.json`
- motor Kordata
- publicador seguro
- GitHub Pages
- PWA
- SEO

Tampoco publica automaticamente. La publicacion sigue controlada por el publicador seguro.
