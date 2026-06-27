# Auditor de calidad del catalogo STYLUS

El auditor de calidad mide el estado real del catalogo comercial antes de cualquier publicacion. Lee los resultados del flujo Kordata, enriquecimiento e imagenes, y genera reportes para decidir que productos estan listos para vender y cuales necesitan trabajo.

No publica automaticamente, no modifica `data/products.json`, no modifica `data/products.backup.json`, no usa API, no usa credenciales y no descarga imagenes.

## Que mide

El auditor evalua cada producto enriquecido con estos datos:

- modelo, marca, color y categoria original
- categoria comercial, genero y nombre comercial
- descripciones corta y larga
- imagen principal, fuente de imagen y estado de imagen
- tallas disponibles, disponibilidad total y existencia total
- estado de enriquecimiento
- bandera `publicable`

Tambien calcula una puntuacion `quality_score` de 0 a 100:

- stock disponible: 20 puntos
- imagen principal: 25 puntos
- nombre comercial: 15 puntos
- categoria comercial: 10 puntos
- genero: 10 puntos
- descripcion corta: 10 puntos
- estado `COMPLETO` o `PUBLICADO`: 10 puntos

## Como ejecutarlo

Antes de auditar, genera la base enriquecida:

```bash
npm run import:kordata
npm run enrich:products
```

Luego ejecuta:

```bash
npm run audit:quality
```

Si `catalog-data/exports/stylus-products.enriched.json` no existe o no contiene productos, el auditor muestra un mensaje claro indicando que primero deben ejecutarse `npm run import:kordata` y `npm run enrich:products`.

## Reportes generados

El auditor escribe:

- `catalog-data/exports/catalog-quality.generated.json`
- `catalog-data/reports/quality-summary.md`
- `catalog-data/reports/quality-by-brand.md`
- `catalog-data/reports/quality-by-category.md`
- `catalog-data/reports/quality-missing-images.md`
- `catalog-data/reports/quality-high-stock-missing-image.md`
- `catalog-data/reports/quality-almost-ready.md`
- `catalog-data/reports/quality-not-publicable.md`

## Como interpretar los reportes

`quality-summary.md` responde cuantas piezas estan realmente listas para vender: total evaluado, con stock, con imagen, publicables, no publicables, cobertura de imagen y avance de enriquecimiento.

`quality-by-brand.md` muestra donde conviene empujar el trabajo por marca: cobertura de imagen y porcentaje publicable.

`quality-by-category.md` permite detectar categorias con inventario pero baja calidad comercial.

`quality-missing-images.md` lista productos con stock y sin imagen. Son bloqueos directos para publicacion.

`quality-high-stock-missing-image.md` prioriza los 50 productos con mayor disponibilidad que aun no tienen imagen.

`quality-almost-ready.md` lista productos con stock, imagen, nombre comercial y categoria comercial, pero que todavia no son publicables por pocos campos.

`quality-not-publicable.md` lista los productos no publicables con sus campos faltantes.

## Como priorizar trabajo

1. Atiende primero `quality-high-stock-missing-image.md`: mucho stock sin imagen significa oportunidad bloqueada.
2. Revisa `quality-almost-ready.md`: suelen ser productos que requieren pocos ajustes para entrar al preview.
3. Usa `quality-by-brand.md` para escoger marcas con mejor avance y empujar publicaciones por lote.
4. Usa `quality-by-category.md` para balancear el catalogo entre categorias visibles.

## Como medir avance semanal

Cada semana ejecuta:

```bash
npm run audit:quality
```

Compara estos indicadores en `quality-summary.md`:

- cobertura de imagen
- porcentaje de productos publicables
- porcentaje de enriquecimiento completo
- productos con stock sin imagen
- productos casi listos

El objetivo operativo es que suban los porcentajes de imagen, publicables y enriquecimiento completo, mientras bajan los productos sin imagen y no publicables.

## Como decidir que publicar primero

Publica primero productos con:

- `publicable = true`
- `quality_score` alto
- stock positivo
- imagen aprobada
- categoria comercial clara
- buena disponibilidad por talla

Antes de publicar, ejecuta siempre:

```bash
npm run publish:preview
```

Revisa el preview y los reportes. La publicacion final solo debe hacerse con el publicador seguro:

```bash
npm run publish:stylus
```

## Como evitar productos incompletos

No publiques productos que aparezcan en `quality-not-publicable.md`. Si un producto aparece en `quality-almost-ready.md`, completa primero los campos faltantes en `catalog-data/enrichment/products.enrichment.csv` o `catalog-data/images/image-map.csv`, vuelve a ejecutar `npm run enrich:products` y luego repite `npm run audit:quality`.

No subas inventario real completo, costos reales, credenciales, URLs privadas o imagenes sensibles al repositorio. Usa solo muestras controladas para pruebas versionadas.
