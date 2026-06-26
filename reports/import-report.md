# Reporte de importación de productos

- Fuente: `data/import/products.master.csv`
- Borrador generado: `data/import/products.generated.json`
- Salida pública solicitada: `data/products.json`
- Modo: publish
- Estado comercial: borrador de migración
- Publicación bloqueada: sí
- Filas leídas: 10
- Productos generados: 10
- Errores: 0
- Advertencias críticas: 40
- Advertencias menores: 0

> Las 10 referencias extraídas desde Canva son borrador de migración, no inventario público final.

## Hallazgos

| Severidad | Tipo | Fila | SKU | Mensaje |
| --- | --- | ---: | --- | --- |
| critical_warning | missing_category | 2 | T22-1 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 2 | T22-1 | Producto sin marca confirmada. |
| critical_warning | missing_color | 2 | T22-1 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 2 | T22-1 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| critical_warning | missing_category | 3 | T21-1 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 3 | T21-1 | Producto sin marca confirmada. |
| critical_warning | missing_color | 3 | T21-1 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 3 | T21-1 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| critical_warning | missing_category | 4 | T655-18 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 4 | T655-18 | Producto sin marca confirmada. |
| critical_warning | missing_color | 4 | T655-18 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 4 | T655-18 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| critical_warning | missing_category | 5 | K998-3 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 5 | K998-3 | Producto sin marca confirmada. |
| critical_warning | missing_color | 5 | K998-3 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 5 | K998-3 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| critical_warning | missing_category | 6 | K991-2 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 6 | K991-2 | Producto sin marca confirmada. |
| critical_warning | missing_color | 6 | K991-2 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 6 | K991-2 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| critical_warning | missing_category | 7 | K998-2 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 7 | K998-2 | Producto sin marca confirmada. |
| critical_warning | missing_color | 7 | K998-2 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 7 | K998-2 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| critical_warning | missing_category | 8 | K997-3 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 8 | K997-3 | Producto sin marca confirmada. |
| critical_warning | missing_color | 8 | K997-3 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 8 | K997-3 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| critical_warning | missing_category | 9 | K997-1 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 9 | K997-1 | Producto sin marca confirmada. |
| critical_warning | missing_color | 9 | K997-1 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 9 | K997-1 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| critical_warning | missing_category | 10 | K998-1 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 10 | K998-1 | Producto sin marca confirmada. |
| critical_warning | missing_color | 10 | K998-1 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 10 | K998-1 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |
| critical_warning | missing_category | 11 | K997-6 | Producto sin categoría confirmada. |
| critical_warning | missing_brand | 11 | K997-6 | Producto sin marca confirmada. |
| critical_warning | missing_color | 11 | K997-6 | Producto sin color principal confirmado. |
| critical_warning | missing_image | 11 | K997-6 | Producto sin imagen principal real; se usó placeholder técnico solo para borrador. |

## Siguiente paso

Completar categoría, marca, color e imágenes reales antes de publicar en `data/products.json`.
