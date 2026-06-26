# Resumen de migración comercial STYLUS

- Fuente: `catalog-data/csv/products.master.csv`
- Exportación borrador: `catalog-data/exports/products.generated.json`
- Catálogo público: `data/products.json` no se modifica en esta etapa.
- Modo: draft
- Estado comercial: borrador de migración por lotes.

> Las 10 referencias extraídas desde Canva son borrador de migración, no inventario público final.

## Totales

- Productos leídos: 10
- Productos completos: 0
- Productos pendientes: 10
- Productos publicados: 0
- Imágenes pendientes: 10
- Errores: 0
- Advertencias críticas: 40
- Advertencias menores: 10

## Lotes

| Lote | Páginas | Productos | Revisados | Publicados | Pendientes |
| --- | --- | ---: | ---: | ---: | ---: |
| Lote 01 | Páginas 1-5 | 10 | 0 | 0 | 10 |

## Hallazgos

| Severidad | Tipo | Fila | SKU | Mensaje |
| --- | --- | ---: | --- | --- |
| critical_warning | missing_category | 2 | T22-1 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 2 | T22-1 | Producto sin marca confirmada. |
| critical_warning | missing_color | 2 | T22-1 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 2 | T22-1 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| warning | quality_incomplete | 2 | T22-1 | Calidad comercial 38/100. |
| critical_warning | missing_category | 3 | T21-1 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 3 | T21-1 | Producto sin marca confirmada. |
| critical_warning | missing_color | 3 | T21-1 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 3 | T21-1 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| warning | quality_incomplete | 3 | T21-1 | Calidad comercial 38/100. |
| critical_warning | missing_category | 4 | T655-18 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 4 | T655-18 | Producto sin marca confirmada. |
| critical_warning | missing_color | 4 | T655-18 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 4 | T655-18 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| warning | quality_incomplete | 4 | T655-18 | Calidad comercial 38/100. |
| critical_warning | missing_category | 5 | K998-3 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 5 | K998-3 | Producto sin marca confirmada. |
| critical_warning | missing_color | 5 | K998-3 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 5 | K998-3 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| warning | quality_incomplete | 5 | K998-3 | Calidad comercial 38/100. |
| critical_warning | missing_category | 6 | K991-2 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 6 | K991-2 | Producto sin marca confirmada. |
| critical_warning | missing_color | 6 | K991-2 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 6 | K991-2 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| warning | quality_incomplete | 6 | K991-2 | Calidad comercial 38/100. |
| critical_warning | missing_category | 7 | K998-2 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 7 | K998-2 | Producto sin marca confirmada. |
| critical_warning | missing_color | 7 | K998-2 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 7 | K998-2 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| warning | quality_incomplete | 7 | K998-2 | Calidad comercial 38/100. |
| critical_warning | missing_category | 8 | K997-3 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 8 | K997-3 | Producto sin marca confirmada. |
| critical_warning | missing_color | 8 | K997-3 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 8 | K997-3 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| warning | quality_incomplete | 8 | K997-3 | Calidad comercial 38/100. |
| critical_warning | missing_category | 9 | K997-1 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 9 | K997-1 | Producto sin marca confirmada. |
| critical_warning | missing_color | 9 | K997-1 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 9 | K997-1 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| warning | quality_incomplete | 9 | K997-1 | Calidad comercial 38/100. |
| critical_warning | missing_category | 10 | K998-1 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 10 | K998-1 | Producto sin marca confirmada. |
| critical_warning | missing_color | 10 | K998-1 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 10 | K998-1 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| warning | quality_incomplete | 10 | K998-1 | Calidad comercial 38/100. |
| critical_warning | missing_category | 11 | K997-6 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 11 | K997-6 | Producto sin marca confirmada. |
| critical_warning | missing_color | 11 | K997-6 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 11 | K997-6 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| warning | quality_incomplete | 11 | K997-6 | Calidad comercial 38/100. |

