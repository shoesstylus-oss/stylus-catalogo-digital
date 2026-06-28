# Investigacion de URLs de imagenes Kordata

Esta guia sirve para descubrir, de forma manual y controlada, las URLs de imagenes que Kordata ya muestra en pantalla y que pueden estar alojadas en Azure Blob Storage, por ejemplo dominios como:

```text
https://pruebablobstorage.blob.core.windows.net/28136/...
```

El objetivo es evitar duplicar trabajo visual ya hecho en Kordata y documentar de donde sale cada imagen antes de cargarla en `catalog-data/images/image-map.csv`.

## Alcance y seguridad

- No usar credenciales dentro del repositorio.
- No automatizar scraping todavia.
- No descargar imagenes.
- No modificar Kordata.
- No modificar `data/products.json`.
- No publicar.
- No guardar tokens privados, cookies, headers de sesion, SAS tokens sensibles ni URLs temporales privadas.

Si una URL contiene parametros de acceso, expiracion, firma o token, registrala solo como hallazgo interno en un entorno seguro y no la versiones en el repositorio.

## Preparar la investigacion

1. Abre Kordata en Chrome con una sesion autorizada por STYLUS.
2. Busca un producto piloto por `modelo`, `SKU` o nombre de producto.
3. Abre el detalle o pantalla donde Kordata muestra la imagen del producto.
4. Ten lista la plantilla:

```text
catalog-data/pilot/kordata-image-discovery-template.csv
```

La plantilla permite registrar modelo, SKU, URL interna del producto en Kordata, URL Blob, request de API y metodo detectado.

## Usar Chrome DevTools

1. Con el producto abierto en Kordata, presiona `F12`.
2. Abre la pestana `Network`.
3. Activa `Preserve log` si vas a navegar entre productos.
4. Marca `Disable cache` mientras DevTools esta abierto.
5. Usa los filtros de Network:
   - `Img`
   - `Fetch/XHR`
   - `Media`
6. Recarga el producto o vuelve a abrir su detalle.
7. Busca requests que contengan:
   - `blob.core.windows.net`
   - `azure`
   - `image`
   - `img`
   - extensiones como `.jpg`, `.jpeg`, `.png`, `.webp`

## Detectar URLs directas de imagen

En el filtro `Img`:

1. Selecciona cada request que parezca imagen del producto.
2. Revisa `Headers`.
3. Copia `Request URL`.
4. Confirma que el dominio sea esperado, por ejemplo `blob.core.windows.net`.
5. Registra la URL en `blob_image_url`.
6. Usa `metodo_detectado = IMG`.

Si la URL abre directamente la imagen en una pestana nueva sin requerir cookies ni headers privados, puede ser candidata para `image_url` en `catalog-data/images/image-map.csv`.

## Detectar URLs desde Fetch/XHR

En el filtro `Fetch/XHR`:

1. Selecciona llamadas que se ejecuten al abrir el producto.
2. Revisa `Headers` y copia `Request URL` en `api_request_url`.
3. Abre la pestana `Preview` o `Response`.
4. Busca campos que contengan URLs o rutas de imagen, por ejemplo:
   - `image`
   - `imageUrl`
   - `url`
   - `photo`
   - `foto`
   - `blob`
5. Si aparece JSON, copia solo un fragmento minimo y anonimizado en `api_response_sample`.
6. Usa `metodo_detectado = XHR_JSON`.

No copies cookies, bearer tokens, authorization headers ni datos personales.

## Detectar imagen desde HTML

En algunos casos Kordata puede renderizar la imagen directamente en el HTML:

1. Abre la pestana `Elements`.
2. Usa el selector o busca `img`.
3. Revisa atributos como `src`, `data-src`, `srcset` o estilos con `background-image`.
4. Si el valor contiene `blob.core.windows.net`, registra esa URL en `blob_image_url`.
5. Usa `metodo_detectado = HTML_IMG`.

## Distinguir el origen de la URL

Registra en `metodo_detectado` una de estas opciones:

- `IMG`: la URL aparece como request directo de imagen en Network.
- `XHR_JSON`: la URL viene dentro de una respuesta JSON.
- `HTML_IMG`: la URL aparece en el HTML o atributo `src`.
- `MEDIA`: la URL aparece en el filtro Media.
- `NO_ENCONTRADA`: no se detecto URL para ese producto.

En `notas`, explica cualquier detalle util, por ejemplo:

- La URL abre sin autenticacion.
- La URL parece temporal.
- La respuesta requiere sesion de Kordata.
- Hay varias imagenes y se necesita elegir principal.
- La imagen no coincide visualmente con el producto.

## Como trasladar hallazgos a image-map.csv

Cuando una URL sea valida y aprobada para catalogo:

1. Copia `blob_image_url`.
2. Abre `catalog-data/images/image-map.csv`.
3. Registra:

```text
modelo,marca,color,sku,image_source,image_url,local_path,gallery,image_status,notas
```

4. Usa `image_source = azure_blob` si la URL viene de Azure Blob Storage.
5. Usa `image_source = kordata` si la URL viene de una ruta Kordata no claramente Azure.
6. Usa `image_status = ASIGNADA` cuando la URL existe pero no fue revisada visualmente.
7. Usa `image_status = APROBADA` solo cuando STYLUS ya verifico visualmente que la imagen corresponde al producto.

## Validacion posterior

Despues de completar `image-map.csv`, ejecuta:

```bash
node integrations/stylus/enrich-products.mjs
node integrations/stylus/audit-catalog-quality.mjs
node integrations/stylus/publish-products.mjs --preview
```

El preview no debe modificar `data/products.json`. La publicacion final sigue bloqueada hasta revision y aprobacion explicita.

## Que no hacer todavia

- No automatizar login.
- No hacer scraping masivo.
- No guardar credenciales ni cookies.
- No descargar archivos de imagen desde Kordata.
- No subir inventario real completo ni costos reales.
- No publicar productos automaticamente.
