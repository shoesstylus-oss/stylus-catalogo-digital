# Muestra controlada Kordata

`kordata-inventory.sample.xlsx` es una muestra controlada y ficticia con la forma de una exportacion Excel de inventario de Kordata. Incluye filas administrativas antes de la tabla para validar la deteccion automatica de encabezados.

La muestra confirma que el importador detecta:

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

Tambien confirma que el agrupamiento por Modelo + Marca + Color + Categoria consolida multiples tallas, multiples filas de existencia, existencia total, disponible total y existencia por sucursal.

Ejecuta la prueba con:

```bash
npm run test:kordata:sample
```

No guardes exportaciones reales de Kordata en esta carpeta si contienen informacion sensible, costos reales, ubicaciones internas no publicables o inventario operativo. Para pruebas versionadas usa solo muestras controladas y anonimizadas.
