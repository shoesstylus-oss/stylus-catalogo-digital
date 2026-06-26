# Carga de productos reales STYLUS

Esta guía explica cómo reemplazar los productos de ejemplo por productos reales de Tiendas STYLUS sin cambiar la arquitectura de la plataforma.

## Archivos principales

- `data/products.json`: base de productos visible en el catálogo.
- `data/products.template.json`: plantilla de referencia para nuevos productos.
- `assets/products/`: carpeta para fotografías reales y galerías.

## Flujo recomendado

1. Optimizar las imágenes del producto.
2. Guardarlas en `assets/products/`.
3. Copiar un objeto desde `data/products.template.json`.
4. Pegarlo en `data/products.json`.
5. Cambiar todos los campos por información real.
6. Verificar que el `id` sea único.
7. Verificar que las rutas de `imagen` y `galería` existan.
8. Probar el catálogo, filtros, búsqueda y página individual.

## Recomendaciones para imágenes

- Usa `.webp` para productos nuevos siempre que sea posible.
- Tamaño sugerido: `1200x900 px`.
- Peso sugerido: menos de `300 KB` por imagen.
- Usa nombres simples, en minúsculas y sin espacios.
- Usa guiones para separar palabras.

Ejemplos:

```text
assets/products/tenis-runner-negro.webp
assets/products/tenis-runner-negro-lateral.webp
assets/products/tenis-runner-negro-suela.webp
```

## Campos obligatorios

Cada producto en `data/products.json` debe incluir:

- `id`: identificador único usado en la URL de detalle.
- `sku`: código interno o comercial del producto.
- `nombre`: nombre visible para clientes.
- `marca`: marca o línea comercial.
- `categoría`: familia del producto, por ejemplo Calzado, Ropa o Accesorios.
- `género`: Hombre, Mujer, Unisex, Niño, Niña u otro valor comercial.
- `color`: color principal.
- `tallas`: lista de tallas disponibles.
- `precio`: precio público o texto como `Consultar`.
- `precio_mayorista`: precio mayorista o texto comercial.
- `estado`: estado visible, por ejemplo Disponible, Agotado o Próximamente.
- `nuevo`: `true` si debe aparecer como novedad.
- `destacado`: `true` si debe aparecer como destacado.
- `imagen`: imagen principal del producto.
- `galería`: lista de imágenes para la página individual.
- `descripción`: texto comercial descriptivo.

## Ejemplo de producto real

```json
{
  "id": "tenis-runner-negro",
  "sku": "STY-CAL-100",
  "nombre": "Tenis runner negro",
  "marca": "STYLUS",
  "categoría": "Calzado",
  "género": "Hombre",
  "color": "Negro",
  "tallas": ["39", "40", "41", "42", "43"],
  "precio": "Consultar",
  "precio_mayorista": "Precio mayorista por WhatsApp",
  "estado": "Disponible",
  "nuevo": true,
  "destacado": false,
  "imagen": "assets/products/tenis-runner-negro.webp",
  "galería": [
    "assets/products/tenis-runner-negro.webp",
    "assets/products/tenis-runner-negro-lateral.webp"
  ],
  "descripción": "Tenis deportivo de alta rotación para pedidos mayoristas STYLUS."
}
```

## Lista de validación

Antes de publicar productos reales, confirma:

- SKU completo y sin duplicados.
- Nombre claro y comercial.
- Marca correcta.
- Categoría consistente con los filtros.
- Género consistente con los filtros.
- Color principal correcto.
- Tallas como arreglo JSON.
- Precio revisado.
- Precio mayorista revisado.
- Estado correcto.
- Nuevo marcado con `true` o `false`.
- Destacado marcado con `true` o `false`.
- Imagen principal existente en `assets/products/`.
- Galería con rutas existentes en `assets/products/`.
- Descripción breve, clara y orientada a venta.

## Reglas importantes

- No cambies los nombres de las propiedades JSON.
- No uses comillas curvas.
- No dejes comas sobrantes al final de arreglos u objetos.
- No uses rutas absolutas de Windows.
- No cargues imágenes pesadas sin optimizar.
- No borres los archivos de logo oficial en `assets/logo/`.

## Qué no incluye esta fase

La carga de productos reales sigue siendo manual por archivo JSON. No se implementa panel administrativo, login, carrito, inventario en tiempo real, ERP ni base de datos externa.
