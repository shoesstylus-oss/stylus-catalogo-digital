# Motor de enriquecimiento comercial STYLUS

El Motor de Enriquecimiento Comercial STYLUS combina la base operativa generada desde Kordata con una capa editorial propia de STYLUS. Kordata conserva los datos duros de inventario, precio, costo, disponibilidad, talla y sucursal; STYLUS agrega contenido comercial, visual y de marketing antes de cualquier publicacion.

Este flujo no conecta API, no usa credenciales, no modifica Kordata y no publica automaticamente.

## Por que Kordata no debe contener marketing

Kordata es la fuente oficial operativa. Debe mantenerse estable para inventario, costos, disponibilidad y trazabilidad de sucursales. Los nombres comerciales, descripciones, categorias de catalogo, etiquetas, imagenes de Canva, promociones y criterios de publicacion cambian con campanas comerciales y no deben contaminar la fuente administrativa.

## Archivos principales

- Entrada Kordata: `catalog-data/exports/kordata-products.generated.json`
- Base STYLUS: `catalog-data/enrichment/products.enrichment.csv`
- Plantilla controlada: `catalog-data/enrichment/products.enrichment.template.csv`
- Salida enriquecida: `catalog-data/exports/stylus-products.enriched.json`
- Motor: `integrations/stylus/enrich-products.mjs`

## Como llenar products.enrichment.csv

Cada fila representa un producto agrupado o modelo comercial. La llave de emparejamiento es:

```text
modelo + marca + color + categoria_original
```

Columnas obligatorias:

```text
modelo,marca,color,categoria_original,nombre_comercial,categoria_comercial,subcategoria_comercial,genero,descripcion_corta,descripcion_larga,precio_mayorista,promocion,nuevo,destacado,etiquetas,imagen_principal,galeria,video_url,slug,estado_enriquecimiento,notas
```

Estados permitidos:

- `PENDIENTE`
- `EN_REVISION`
- `COMPLETO`
- `PUBLICADO`

Usa `products.enrichment.template.csv` como referencia. Sus filas son ficticias y controladas; no contienen costos reales.

## Ejecutar el motor

Desde la raiz del repositorio:

```bash
npm run enrich:products
```

El comando genera:

- `catalog-data/exports/stylus-products.enriched.json`
- `catalog-data/reports/enrichment-summary.md`
- `catalog-data/reports/enrichment-missing-data.md`
- `catalog-data/reports/enrichment-ready-to-publish.md`
- `catalog-data/reports/enrichment-pending.md`

## Criterio publicable

`publicable = true` solo cuando el producto tiene:

- `nombre_comercial`
- `categoria_comercial`
- `genero`
- `descripcion_corta`
- `imagen_principal`
- `estado_enriquecimiento` en `COMPLETO` o `PUBLICADO`
- `disponibleTotal > 0`

Si falta algo, el producto queda como `publicable = false`.

## Revisar reportes

- `enrichment-summary.md`: totales de productos Kordata, productos con/sin enriquecimiento, publicables y pendientes.
- `enrichment-missing-data.md`: campos faltantes por producto y estados invalidos.
- `enrichment-ready-to-publish.md`: productos listos para revision comercial y futura publicacion.
- `enrichment-pending.md`: productos que necesitan completar contenido, imagenes o estado.

## Preparar productos para publicacion

1. Ejecuta primero `npm run import:kordata` para actualizar la base operativa.
2. Llena o actualiza `catalog-data/enrichment/products.enrichment.csv`.
3. Ejecuta `npm run enrich:products`.
4. Revisa reportes y corrige filas pendientes.
5. Solo considera publicar productos con `publicable = true`.

Este modulo no actualiza `data/products.json`; la publicacion queda para una etapa posterior.

## Asociar imagenes desde Canva

Exporta imagenes finales desde Canva y guardalas en una ruta controlada del repositorio, por ejemplo:

```text
assets/products/canva/
```

Luego referencia esa ruta en `imagen_principal` y separa la `galeria` con `|`:

```text
assets/products/canva/urb-100-blanco.jpg
assets/products/canva/urb-100-blanco-1.jpg|assets/products/canva/urb-100-blanco-2.jpg
```

No uses URLs privadas, enlaces temporales ni archivos que dependan de sesiones personales de Canva.

## Evitar datos sensibles

No subas exportaciones reales de Kordata, costos reales en ejemplos, inventario operativo vigente, datos de proveedores, ubicaciones internas no publicables ni credenciales. Las muestras versionadas deben ser ficticias, anonimizadas o controladas.

## Seguridad

Este motor mantiene intactos:

- `data/products.json`
- motor Kordata
- GitHub Pages
- PWA
- SEO
- WhatsApp `50589468126`
- logo oficial STYLUS
