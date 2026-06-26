# Reporte de importación de productos

- Fuente: `data/import/products.master.csv`
- Salida: `data/products.json`
- Modo validación: no
- Filas leídas: 10
- Productos generados: 10
- Errores: 0
- Advertencias: 20

## Hallazgos

| Severidad | Tipo | Fila | SKU | Mensaje |
| --- | --- | ---: | --- | --- |
| warning | missing_category | 2 | T22-1 | Producto sin categoría confirmada. |
| warning | missing_image | 2 | T22-1 | Producto sin imagen principal; se usó placeholder técnico existente. |
| warning | missing_category | 3 | T21-1 | Producto sin categoría confirmada. |
| warning | missing_image | 3 | T21-1 | Producto sin imagen principal; se usó placeholder técnico existente. |
| warning | missing_category | 4 | T655-18 | Producto sin categoría confirmada. |
| warning | missing_image | 4 | T655-18 | Producto sin imagen principal; se usó placeholder técnico existente. |
| warning | missing_category | 5 | K998-3 | Producto sin categoría confirmada. |
| warning | missing_image | 5 | K998-3 | Producto sin imagen principal; se usó placeholder técnico existente. |
| warning | missing_category | 6 | K991-2 | Producto sin categoría confirmada. |
| warning | missing_image | 6 | K991-2 | Producto sin imagen principal; se usó placeholder técnico existente. |
| warning | missing_category | 7 | K998-2 | Producto sin categoría confirmada. |
| warning | missing_image | 7 | K998-2 | Producto sin imagen principal; se usó placeholder técnico existente. |
| warning | missing_category | 8 | K997-3 | Producto sin categoría confirmada. |
| warning | missing_image | 8 | K997-3 | Producto sin imagen principal; se usó placeholder técnico existente. |
| warning | missing_category | 9 | K997-1 | Producto sin categoría confirmada. |
| warning | missing_image | 9 | K997-1 | Producto sin imagen principal; se usó placeholder técnico existente. |
| warning | missing_category | 10 | K998-1 | Producto sin categoría confirmada. |
| warning | missing_image | 10 | K998-1 | Producto sin imagen principal; se usó placeholder técnico existente. |
| warning | missing_category | 11 | K997-6 | Producto sin categoría confirmada. |
| warning | missing_image | 11 | K997-6 | Producto sin imagen principal; se usó placeholder técnico existente. |

## Siguiente paso

Completar los campos pendientes en `data/import/products.master.csv`, cargar imágenes reales en `assets/products/` y volver a ejecutar `npm run import:products`.
