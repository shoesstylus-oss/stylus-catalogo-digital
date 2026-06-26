# Migración del Catálogo Maestro Canva STYLUS 2026

Esta guía explica cómo convertir información comercial del **Catálogo Maestro STYLUS 2026** en datos estructurados para la plataforma digital, sin editar directamente `data/products.json` y sin integrar todavía Canva API, login, carrito, ERP, panel administrativo ni base de datos externa.

## Fuente inicial

La información inicial se obtuvo desde el diseño de Canva `DAHLitKfdE0`, usando el contenido de texto visible del Catálogo Maestro STYLUS 2026.

En esta fase se cargaron 10 referencias visibles:

- `T22-1`
- `T21-1`
- `T655-18`
- `K998-3`
- `K991-2`
- `K998-2`
- `K997-3`
- `K997-1`
- `K998-1`
- `K997-6`

Solo se registraron datos visibles: código, tallas, precio unitario, precio mayorista y promoción cuando aparece. Si un dato no era visible o no estaba confirmado, se dejó vacío o como `Pendiente`.

## Archivo maestro

El archivo de trabajo es:

```text
data/import/products.master.csv
```

Este CSV es la fuente sostenible para cargar productos reales. Sus columnas son:

```text
sku,codigo_interno,nombre,marca,modelo,categoria,subcategoria,genero,color_principal,colores,tallas,precio_normal,precio_mayorista,precio_promocion,tipo_promocion,estado,nuevo,destacado,descripcion_corta,descripcion_larga,imagen_principal,galeria,etiquetas,origen
```

## Cómo llenar el CSV

- Usa un SKU único por fila.
- Separa tallas con coma: `"36, 37, 38, 39"`.
- Separa colores con coma: `"Negro, Blanco"`.
- Separa galería con coma: `"assets/products/foto-1.webp, assets/products/foto-2.webp"`.
- Usa booleanos en `nuevo` y `destacado` como `sí/no`, `true/false` o `1/0`.
- Conserva precios en formato comercial: `C$ 1200`, `C$ 1100`, `2 x C$ 1200` o `Consultar`.
- Si un dato no está confirmado, usa `Pendiente` o deja el campo vacío.

## Ejecutar importación

Desde la raíz del repositorio:

```bash
npm run import:products
```

Este comando lee `data/import/products.master.csv` y genera:

```text
data/products.json
reports/import-report.json
reports/import-report.md
```

## Validar sin alterar productos

Para revisar el CSV y generar reportes sin sobrescribir `data/products.json`:

```bash
npm run validate:products
```

## Revisar reportes

Después de ejecutar importación o validación, revisa:

- `reports/import-report.md`: reporte legible para revisión comercial.
- `reports/import-report.json`: reporte estructurado para automatización futura.

El reporte indica:

- SKU duplicados.
- Productos sin SKU.
- Productos sin categoría.
- Productos sin tallas.
- Productos sin precio.
- Productos sin imagen.
- Imágenes referenciadas que no existen en `assets/products/`.
- Productos con estado vacío.
- Productos con descripción vacía.

Las advertencias no detienen el proceso. Sirven para corregir la base antes de publicar productos reales.

## Subir imágenes reales

1. Optimiza cada imagen antes de subirla.
2. Usa nombres en minúsculas, sin espacios y con guiones.
3. Guarda los archivos en `assets/products/`.
4. Completa `imagen_principal` con la ruta principal.
5. Completa `galeria` con rutas separadas por coma.

Ejemplo:

```csv
assets/products/t22-1-principal.webp,"assets/products/t22-1-principal.webp, assets/products/t22-1-lateral.webp"
```

## Corregir errores

1. Abre `reports/import-report.md`.
2. Ubica fila y SKU.
3. Corrige el dato en `data/import/products.master.csv`.
4. Ejecuta `npm run validate:products`.
5. Cuando el reporte esté limpio o aceptado, ejecuta `npm run import:products`.

## Publicar en GitHub Pages

1. Ejecuta `npm run import:products`.
2. Verifica que `data/products.json` esté actualizado.
3. Revisa el catálogo localmente.
4. Haz commit de CSV, JSON, reportes, imágenes y documentación.
5. Abre un Pull Request hacia `main`.
6. Al hacer merge, GitHub Pages publica desde el flujo existente de GitHub Actions.

## Reglas de esta fase

- No editar `data/products.json` manualmente como fuente principal.
- No inventar datos no visibles del catálogo maestro.
- No crear integración directa con Canva API.
- No implementar login, carrito, checkout, ERP, inventario, base de datos externa ni panel administrativo.
- Mantener intactos el logo oficial STYLUS, WhatsApp `50589468126`, GitHub Pages, PWA, SEO, accesibilidad y estructura modular.
