# Migración del Catálogo Maestro Canva STYLUS 2026

Esta guía explica cómo convertir información comercial del **Catálogo Maestro STYLUS 2026** en datos estructurados para la plataforma digital, sin reemplazar el catálogo público con productos incompletos.

## Base oficial de trabajo

La Etapa 1 mueve el flujo de digitalización a una estructura separada:

```text
catalog-data/
|-- csv/
|   `-- products.master.csv
|-- images/
|   |-- pending/
|   `-- processed/
|-- reports/
|   |-- migration-summary.md
|   |-- missing-data.md
|   |-- duplicate-skus.md
|   `-- migration-progress.md
`-- exports/
    `-- products.generated.json
```

`data/products.json` sigue siendo el catálogo público vigente y no se modifica en esta etapa.

## Digitalización por lotes

Cada bloque de trabajo representa un rango de páginas del Catálogo Maestro Canva:

- Lote 01: Páginas 1-5.
- Lote 02: Páginas 6-10.
- Lote 03: Páginas 11-15.

Los lotes se registran en el CSV con `batch_id`, `batch_name`, `page_range`, `page_start` y `page_end`.

## Estados de migración

La columna `migration_status` acepta únicamente:

- `PENDIENTE`
- `EN_REVISION`
- `COMPLETO`
- `PUBLICADO`

## Estados de imagen

La columna `image_status` acepta únicamente:

- `NO_CARGADA`
- `PENDIENTE`
- `OPTIMIZADA`
- `PUBLICADA`

Las imágenes en revisión deben colocarse en `catalog-data/images/pending/`. Las imágenes ya preparadas para catálogo deben colocarse en `catalog-data/images/processed/` antes de moverlas a `assets/products/` cuando sean publicables.

## Puntaje de calidad

El importador calcula `quality_score` de 0 a 100 usando ocho criterios:

- Marca.
- Modelo.
- Categoría.
- Descripción.
- Precio.
- Imagen.
- Color.
- Tallas.

Cada criterio completo aporta una parte del puntaje. Un producto publicable debe llegar a 100 y no tener advertencias críticas.

## Comandos

```bash
npm run import:products
```

Genera `catalog-data/exports/products.generated.json`, actualiza los reportes en `catalog-data/reports/` y actualiza `docs/migration-dashboard.md`.

```bash
npm run validate:products
```

Valida el CSV maestro y regenera reportes sin crear exportación.

```bash
npm run publish:products
```

Conservado por compatibilidad, pero bloqueado en Etapa 1. No modifica `data/products.json`.

## Reportes

- `catalog-data/reports/migration-summary.md`: resumen general, lotes y hallazgos.
- `catalog-data/reports/missing-data.md`: datos faltantes por fila y SKU.
- `catalog-data/reports/duplicate-skus.md`: SKU repetidos.
- `catalog-data/reports/migration-progress.md`: total, completos, pendientes, publicados y porcentaje de avance.
- `docs/migration-dashboard.md`: tablero operativo para revisión comercial.

## Reglas de esta etapa

- No editar `data/products.json` como resultado de la migración.
- No publicar productos incompletos o con estado `Pendiente`.
- No inventar datos no confirmados del Catálogo Maestro.
- No implementar carrito, ERP, inventario, API, login, checkout, base de datos externa ni panel administrativo.
- Mantener intactos el logo oficial STYLUS, WhatsApp `50589468126`, GitHub Pages, PWA, SEO y accesibilidad.
