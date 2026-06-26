# Lote piloto real STYLUS

El lote piloto permite escoger hasta 10 productos reales desde el export de inventario Kordata para revisarlos con el flujo completo:

`Kordata -> Enriquecimiento -> Gestor de imagenes -> Preview`

No publica automaticamente, no modifica `data/products.json`, no sube inventario completo y no incluye costos reales.

## 1. Elegir 10 productos desde Kordata

1. Exporta desde Kordata el inventario controlado que STYLUS desea revisar.
2. Guarda el Excel localmente en `catalog-data/kordata/`.
3. No subas al repositorio el inventario real completo, costos reales ni archivos sensibles; versiona solo muestras controladas cuando sea necesario para pruebas.
4. Ejecuta:

```bash
npm run import:kordata
```

5. Revisa `catalog-data/exports/kordata-products.generated.json` y los reportes Kordata.
6. Genera el lote piloto:

```bash
npm run pilot:create
```

El script lee `catalog-data/exports/kordata-products.generated.json`, excluye productos sin modelo o marca, usa solo productos con `disponibleTotal > 0`, ordena por mayor disponibilidad y selecciona maximo 10 modelos.

## 2. Llenar enriquecimiento

El archivo generado queda en:

`catalog-data/pilot/stylus-pilot-10.generated.csv`

`stylus-pilot-10.generated.csv` es un archivo de trabajo generado para preparar el lote piloto. La operacion final del flujo sigue ocurriendo en `catalog-data/enrichment/products.enrichment.csv` y `catalog-data/images/image-map.csv`; el generador no los modifica automaticamente.

Usa ese CSV como guia de trabajo para llenar datos comerciales en una copia controlada o en `catalog-data/enrichment/products.enrichment.csv` cuando STYLUS decida operar el piloto. No pegues costos reales en el piloto; el campo `precio_mayorista` es comercial y debe completarse manualmente solo si aplica.

Campos clave a completar antes de preview:

- `nombre_comercial`
- `categoria_comercial`
- `subcategoria_comercial`
- `genero`
- `descripcion_corta`
- `descripcion_larga`
- `precio_mayorista`
- `promocion`
- `nuevo`
- `destacado`
- `etiquetas`
- `slug`
- `estado_enriquecimiento`

Usa `COMPLETO` solo cuando el producto tenga informacion comercial revisada e imagen aprobada.

## 3. Asociar imagenes

El piloto incluye columnas de apoyo para imagen:

- `imagen_principal`
- `galeria`
- `image_source`
- `image_url`
- `local_path`
- `image_status`

El motor de enriquecimiento resuelve imagenes en este orden:

1. `imagen_principal` en `products.enrichment.csv`
2. `local_path` en `catalog-data/images/image-map.csv`
3. `image_url` en `catalog-data/images/image-map.csv`
4. sin imagen, el producto queda no publicable

## 4. Usar URLs de Kordata/Azure

Las URLs de Kordata o Azure pueden servir como fuente inicial en `image_url`. No se descargan automaticamente, no requieren API y no usan credenciales. Para productos estrategicos, STYLUS debe preferir imagenes propias revisadas.

## 5. Usar imagenes manuales

Coloca imagenes manuales aprobadas en:

`assets/products/stylus/`

Registra la ruta publica o relativa en `catalog-data/images/image-map.csv` usando `local_path`, y marca `image_status` segun corresponda: `PENDIENTE`, `ASIGNADA`, `REVISAR`, `APROBADA` o `RECHAZADA`.

No versiones imagenes reales sensibles o no aprobadas.

## 6. Ejecutar preview

Cuando el piloto tenga enrichment e imagenes:

```bash
npm run enrich:products
npm run publish:preview
```

El preview genera `catalog-data/exports/products.preview.json` y `catalog-data/reports/publish-preview.md`. No modifica `data/products.json`.

## 7. Validar antes de publicar

Antes de cualquier publicacion controlada:

1. Revisa `catalog-data/reports/pilot-10-summary.md`.
2. Revisa `catalog-data/reports/enrichment-summary.md`.
3. Revisa los reportes de imagenes en `catalog-data/reports/images-*.md`.
4. Confirma que los productos publicables tengan imagen, slug, precio, tallas disponibles, nombre comercial y categoria comercial.
5. Confirma que `data/products.json` no haya cambiado durante el piloto.

La publicacion se hace solo con el publicador seguro y en una accion deliberada:

```bash
npm run publish:stylus
```

No ejecutes publicacion si el preview no fue revisado y aprobado por STYLUS.
