# Adaptador de inventario Kordata

Este modulo prepara la exportacion Excel de inventario de Kordata para una base comercial agrupada del catalogo digital STYLUS. No conecta API, no usa credenciales, no modifica Kordata y no publica cambios en `data/products.json`.

## Exportar desde Kordata

1. En Kordata, abre el reporte o pantalla de inventario de productos.
2. Exporta el inventario a Excel (`.xlsx`) con columnas de producto, modelo, talla, color, categoria, marca, precios, costo, reservado, disponible, existencia y ubicacion.
3. Conserva el archivo tal como lo entrega Kordata. El importador detecta la fila real de encabezados aunque existan filas administrativas antes de la tabla.

## Guardar el Excel

Guarda uno o mas archivos `.xlsx` en:

```bash
catalog-data/kordata/
```

Los Excel reales exportados desde Kordata deben tratarse como informacion operativa sensible. No subas al repositorio inventario real, costos reales, disponibilidad vigente, ubicaciones internas no publicables ni datos de proveedores. Si necesitas versionar una muestra, usa solo archivos controlados, ficticios o anonimizados como `catalog-data/kordata/samples/kordata-inventory.sample.xlsx`.

Tambien puedes procesar un archivo puntual con `--input`:

```bash
npm run import:kordata -- --input catalog-data/kordata/inventario-kordata.xlsx
```

## Ejecutar el importador

Desde la raiz del repositorio:

```bash
npm run import:kordata
```

El comando genera:

- `catalog-data/exports/kordata-products.generated.json`
- `catalog-data/reports/kordata-summary.md`
- `catalog-data/reports/kordata-stock-by-branch.md`
- `catalog-data/reports/kordata-missing-data.md`
- `catalog-data/reports/kordata-low-stock.md`

## Revisar reportes

- `kordata-summary.md`: totales, encabezados detectados y estado general.
- `kordata-stock-by-branch.md`: existencia por sucursal para cada grupo comercial.
- `kordata-missing-data.md`: filas con campos obligatorios vacios o incompletos.
- `kordata-low-stock.md`: productos con disponible total menor o igual al umbral.

Puedes ajustar el umbral de stock bajo:

```bash
npm run import:kordata -- --low-stock 5
```

## Prueba documentada con muestra controlada

El repositorio incluye una muestra representativa y ficticia en:

```bash
catalog-data/kordata/samples/kordata-inventory.sample.xlsx
```

La muestra tiene cuatro filas administrativas antes de la tabla y la fila 5 como encabezado real. Ejecuta:

```bash
npm run test:kordata:sample
```

La prueba confirma que el motor detecta correctamente:

- SKU
- NombreDelProducto
- Modelo
- Talla
- Color
- Categoria
- Marca
- PrecioDeVenta
- Costo
- Reservado
- Disponible
- Existencia
- Ubicacion

Tambien confirma que el agrupamiento por Modelo + Marca + Color + Categoria consolida multiples tallas, multiples filas por existencia, existencia total, disponible total y existencia por sucursal. Para la muestra `URB-100 + STYLUS + Blanco + Tenis`, el resultado esperado es:

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

La prueba tambien valida un segundo grupo `SAN-200 + STYLUS + Negro + Sandalias` con existencia total 1 y disponible total 1 para cubrir stock bajo. Ver detalles en `catalog-data/kordata/samples/kordata-inventory.sample.expected.md`.

## Validar antes de publicar

1. Revisa que `kordata-products.generated.json` agrupe correctamente por modelo, marca, color y categoria.
2. Confirma tallas disponibles, existencia por talla, existencia total y existencia por sucursal.
3. Revisa precio de venta, costo, margen en cordobas y margen porcentual.
4. Corrige en Kordata o en el Excel cualquier dato faltante reportado.
5. Vuelve a ejecutar el importador y conserva `data/products.json` intacto hasta una etapa posterior de publicacion.

Este modulo no publica automaticamente. El catalogo publico actual, GitHub Pages, PWA, SEO, WhatsApp `50589468126` y el logo oficial STYLUS permanecen intactos.

Confirmacion operativa: `data/products.json` no forma parte de la salida del importador Kordata y no se modifica al ejecutar `npm run import:kordata` ni `npm run test:kordata:sample`.
