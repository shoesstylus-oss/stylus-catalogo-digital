# Importador de imagenes Kordata desde Excel de productos

Este importador lee una exportacion de productos Kordata que incluye URLs de imagen y actualiza `catalog-data/images/image-map.csv`.

No descarga imagenes, no usa credenciales, no modifica `data/products.json` y no publica automaticamente.

## Formato esperado

El Excel debe contener estas columnas:

```text
id, Modelo, SKU, Nombre del producto, imagen
```

La columna `imagen` debe contener una URL real ya existente en Kordata o Azure Blob Storage. El importador no inventa URLs y omite filas sin URL.

## Ejecutar

Guarda el Excel en:

```text
catalog-data/kordata/Productos (50).xlsx
```

Luego ejecuta:

```bash
npm run import:kordata:images
```

Tambien puedes pasar un archivo especifico:

```bash
node integrations/kordata/import-kordata-images.mjs --input "C:/Users/PC/Downloads/Productos (50).xlsx"
```

## Salida

El script genera o actualiza:

```text
catalog-data/images/image-map.csv
```

Mapeo de campos:

- `Modelo` -> `modelo`
- `SKU` -> `sku`
- `imagen` -> `image_url`
- `image_source` -> `azure_blob` si la URL contiene `blob.core.windows.net`; si no, `kordata`
- `image_status` -> `ASIGNADA`
- `notas` -> id, nombre del producto, hoja y fila fuente

`marca`, `color`, `local_path` y `gallery` quedan vacios porque el Excel de productos de imagen no los trae.

## Validar despues

Ejecuta:

```bash
node integrations/stylus/enrich-products.mjs
node integrations/stylus/audit-catalog-quality.mjs
node integrations/stylus/publish-products.mjs --preview
```

El preview no debe modificar `data/products.json`. La publicacion final requiere aprobacion explicita.

## Seguridad

- No versionar el Excel real completo de Kordata si contiene informacion operativa sensible, inventario vigente, costos, proveedores, URLs privadas o datos internos.
- Usar solo muestras controladas y ficticias para pruebas versionadas.
- No guardar credenciales, cookies ni tokens.
- No descargar imagenes.
- No publicar automaticamente.
