# Carga de productos reales STYLUS

Esta guía explica cómo preparar productos reales sin afectar el catálogo público hasta que estén listos para clientes.

## Archivos principales

- `catalog-data/csv/products.master.csv`: fuente maestra de digitalización.
- `catalog-data/exports/products.generated.json`: borrador generado desde el CSV maestro.
- `catalog-data/images/pending/`: imágenes recibidas y pendientes de revisión.
- `catalog-data/images/processed/`: imágenes optimizadas para evaluación comercial.
- `catalog-data/reports/`: reportes de calidad, avance y duplicados.
- `data/products.json`: catálogo público visible en GitHub Pages.
- `assets/products/`: imágenes publicables usadas por el sitio.

## Flujo recomendado

1. Registrar el producto en `catalog-data/csv/products.master.csv`.
2. Asignar lote y rango de páginas.
3. Completar `migration_status`, `image_status` y campos comerciales.
4. Colocar imágenes recibidas en `catalog-data/images/pending/`.
5. Optimizar imágenes y moverlas a `catalog-data/images/processed/`.
6. Ejecutar `npm run validate:products`.
7. Revisar `catalog-data/reports/missing-data.md` y `catalog-data/reports/duplicate-skus.md`.
8. Ejecutar `npm run import:products`.
9. Revisar `catalog-data/exports/products.generated.json`.
10. Publicar en `data/products.json` solo en una etapa posterior aprobada.

## Lista de validación para productos reales

- SKU completo y sin duplicados.
- Nombre claro y comercial.
- Marca correcta.
- Modelo confirmado.
- Categoría consistente con los filtros.
- Género consistente con los filtros.
- Color principal correcto.
- Colores adicionales revisados.
- Tallas disponibles.
- Precio revisado.
- Precio mayorista revisado.
- Estado correcto.
- Nuevo marcado con `true` o `false`.
- Destacado marcado con `true` o `false`.
- Imagen principal optimizada.
- Galería con rutas existentes.
- Descripción breve, clara y orientada a venta.
- `migration_status` actualizado.
- `image_status` actualizado.
- `quality_score` en 100 antes de publicar.

## Recomendaciones para imágenes

- Usa `.webp` para productos nuevos siempre que sea posible.
- Tamaño sugerido: `1200x900 px`.
- Peso sugerido: menos de `300 KB` por imagen.
- Usa nombres simples, en minúsculas y sin espacios.
- Usa guiones para separar palabras.
- No uses rutas absolutas de Windows.

## Qué no incluye esta etapa

La carga sigue siendo por archivos del repositorio. No se implementa panel administrativo, login, carrito, inventario en tiempo real, ERP, API, checkout ni base de datos externa.
