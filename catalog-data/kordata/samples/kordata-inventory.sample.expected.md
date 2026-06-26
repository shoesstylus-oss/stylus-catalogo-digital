# Validacion esperada de la muestra Kordata

Comando:

```bash
npm run test:kordata:sample
```

## Encabezado

El motor debe detectar la fila 5 como encabezado real y mapear estas columnas:

| Campo interno | Encabezado de muestra |
| --- | --- |
| sku | SKU |
| nombreDelProducto | NombreDelProducto |
| modelo | Modelo |
| talla | Talla |
| color | Color |
| categoria | Categoria |
| marca | Marca |
| precioDeVenta | PrecioDeVenta |
| costo | Costo |
| reservado | Reservado |
| disponible | Disponible |
| existencia | Existencia |
| ubicacion | Ubicacion |

## Agrupamiento URB-100

Las tres filas `URB-100 + STYLUS + Blanco + Tenis` deben consolidarse en un solo producto comercial:

| Metrica | Valor esperado |
| --- | ---: |
| Tallas disponibles | 37, 38 |
| Existencia total | 12 |
| Disponible total | 10 |
| Reservado total | 2 |
| Existencia STYLUS Centro | 8 |
| Disponible STYLUS Centro | 7 |
| Existencia STYLUS Masaya | 4 |
| Disponible STYLUS Masaya | 3 |

## Agrupamiento SAN-200

La fila `SAN-200 + STYLUS + Negro + Sandalias` debe quedar como un segundo producto comercial con existencia total 1 y disponible total 1 para validar el reporte de stock bajo.

## Seguridad

La prueba genera archivos en `catalog-data/exports/` y `catalog-data/reports/`, pero no modifica `data/products.json`.
