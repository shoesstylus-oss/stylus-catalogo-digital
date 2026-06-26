# Publicador seguro del catalogo STYLUS

El publicador seguro toma `catalog-data/exports/stylus-products.enriched.json` y prepara productos para el catalogo publico en el formato usado por `data/products.json`.

No publica automaticamente. El modo preview genera una vista previa sin tocar el catalogo publico. El modo publish solo escribe `data/products.json` si todos los productos candidatos cumplen reglas estrictas.

## Reglas de publicacion

Solo se consideran productos con `publicable = true`.

Antes de publicar, cada producto publicable debe tener:

- `imagen_principal`
- `slug`
- `precio`
- `tallasDisponibles`
- `nombre_comercial`
- `categoria_comercial`
- `disponibleTotal > 0`

Si falta cualquier campo, la publicacion se bloquea y `data/products.json` no se modifica.

## Revisar productos publicables

Ejecuta primero el enriquecimiento:

```bash
npm run enrich:products
```

Luego revisa:

- `catalog-data/reports/enrichment-ready-to-publish.md`
- `catalog-data/reports/enrichment-missing-data.md`
- `catalog-data/exports/stylus-products.enriched.json`

## Hacer preview

```bash
npm run publish:preview
```

Esto genera:

- `catalog-data/exports/products.preview.json`
- `catalog-data/reports/publish-preview.md`
- `catalog-data/reports/publish-result.md`

El preview no toca `data/products.json`.

## Publicar

```bash
npm run publish:stylus
```

El modo publish:

1. Lee `stylus-products.enriched.json`.
2. Filtra productos `publicable = true`.
3. Valida todos los campos obligatorios.
4. Crea `data/products.backup.json`.
5. Sobrescribe `data/products.json` con el catalogo publicable.

Si no existe al menos 1 producto publicable o hay campos faltantes, el comando falla y no modifica el catalogo publico.

## Prueba versionada

Ejecuta:

```bash
npm run test:publisher:sample
```

La prueba `integrations/stylus/verify-publisher-sample.mjs` usa la muestra Kordata controlada y la plantilla ficticia de enriquecimiento. Verifica que el preview genere 1 producto sin modificar `data/products.json`, que publish genere 1 producto publico y cree backup, que los archivos operativos se restauren al finalizar y que el catalogo publico conserve el mismo hash despues de restaurar.

Tambien valida el bloqueo de seguridad: cuando no hay productos publicables, `publish:stylus` falla y no modifica `data/products.json`.

Las muestras de esta prueba son ficticias/controladas y no contienen inventario real ni costos reales.

## Restaurar backup

Si una publicacion debe revertirse, restaura el backup:

```bash
copy data\products.backup.json data\products.json
```

En Git, tambien puedes revertir el commit de publicacion si el cambio ya fue versionado.

`data/products.backup.json` es un artefacto operativo de una publicacion. No debe versionarse como resultado real salvo una publicacion controlada y revisada explicitamente.

## Evitar productos incompletos

- No marques `estado_enriquecimiento = COMPLETO` si falta imagen real.
- No uses placeholders como imagen final.
- No publiques productos sin disponibilidad.
- Revisa siempre `publish-preview.md` antes de ejecutar publish.
- Mantén la revision comercial dentro de `products.enrichment.csv` y reportes de enrichment.

## Seguridad

Este modulo mantiene intactos:

- logo oficial STYLUS
- WhatsApp `50589468126`
- GitHub Pages
- PWA
- SEO
- motor Kordata
- motor de enriquecimiento
