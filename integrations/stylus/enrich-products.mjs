import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

const kordataInputPath = path.join(rootDir, "catalog-data", "exports", "kordata-products.generated.json");
const enrichmentInputPath = path.join(rootDir, "catalog-data", "enrichment", "products.enrichment.csv");
const imageMapInputPath = path.join(rootDir, "catalog-data", "images", "image-map.csv");
const enrichedOutputPath = path.join(rootDir, "catalog-data", "exports", "stylus-products.enriched.json");
const reportsDir = path.join(rootDir, "catalog-data", "reports");

const enrichmentStates = new Set(["PENDIENTE", "EN_REVISION", "COMPLETO", "PUBLICADO"]);
const requiredEnrichmentColumns = [
  "modelo",
  "marca",
  "color",
  "categoria_original",
  "nombre_comercial",
  "categoria_comercial",
  "subcategoria_comercial",
  "genero",
  "descripcion_corta",
  "descripcion_larga",
  "precio_mayorista",
  "promocion",
  "nuevo",
  "destacado",
  "etiquetas",
  "imagen_principal",
  "galeria",
  "video_url",
  "slug",
  "estado_enriquecimiento",
  "notas"
];

const publicableRequirements = [
  "nombre_comercial",
  "categoria_comercial",
  "genero",
  "descripcion_corta",
  "imagen_principal"
];

const requiredImageMapColumns = [
  "modelo",
  "marca",
  "color",
  "sku",
  "image_source",
  "image_url",
  "local_path",
  "gallery",
  "image_status",
  "notas"
];

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  if (!rows.length) return [];

  const [headers, ...dataRows] = rows;
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));

  return dataRows.map((values) =>
    Object.fromEntries(normalizedHeaders.map((header, index) => [header, normalizeText(values[index] || "")]))
  );
}

function normalizeHeader(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeKeyPart(value = "") {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function productKey({ modelo = "", marca = "", color = "", categoria_original = "", categoria = "" }) {
  return [modelo, marca, color, categoria_original || categoria].map(normalizeKeyPart).join("|");
}

function imageKey({ modelo = "", marca = "", color = "" }) {
  return [modelo, marca, color].map(normalizeKeyPart).join("|");
}

function slugify(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = normalizeText(value);
  if (!text) return 0;
  const cleaned = text
    .replace(/[^\d,.-]/g, "")
    .replace(/,(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function parseBoolean(value = "") {
  return ["si", "sí", "true", "1", "yes", "y"].includes(normalizeText(value).toLowerCase());
}

function splitList(value = "") {
  const text = normalizeText(value);
  if (!text) return [];
  return text
    .split(text.includes("|") ? "|" : ",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateEnrichmentHeaders(rows, csvText) {
  const firstLine = csvText.split(/\r?\n/).find((line) => line.trim());
  const headers = firstLine ? firstLine.split(",").map(normalizeHeader) : [];
  const missing = requiredEnrichmentColumns.filter((column) => !headers.includes(column));
  if (missing.length) {
    throw new Error(`products.enrichment.csv no contiene columnas obligatorias: ${missing.join(", ")}`);
  }
  return rows;
}

function validateImageMapHeaders(rows, csvText) {
  const firstLine = csvText.split(/\r?\n/).find((line) => line.trim());
  const headers = firstLine ? firstLine.split(",").map(normalizeHeader) : [];
  const missing = requiredImageMapColumns.filter((column) => !headers.includes(column));
  if (missing.length) {
    throw new Error(`image-map.csv no contiene columnas obligatorias: ${missing.join(", ")}`);
  }
  return rows;
}

function buildEnrichmentIndex(rows) {
  const index = new Map();
  const duplicateKeys = new Set();
  const invalidStates = [];

  rows.forEach((row, rowIndex) => {
    const state = normalizeText(row.estado_enriquecimiento || "PENDIENTE").toUpperCase();
    row.estado_enriquecimiento = state;
    const key = productKey(row);

    if (index.has(key)) duplicateKeys.add(key);
    if (!enrichmentStates.has(state)) {
      invalidStates.push({
        row: rowIndex + 2,
        key,
        state,
        message: `Estado de enriquecimiento no permitido: ${state}.`
      });
    }

    index.set(key, { ...row, __rowNumber: rowIndex + 2 });
  });

  return { index, duplicateKeys: [...duplicateKeys], invalidStates };
}

function buildImageIndex(rows) {
  const bySku = new Map();
  const byProduct = new Map();

  rows.forEach((row, rowIndex) => {
    const entry = { ...row, __rowNumber: rowIndex + 2 };
    if (entry.sku) bySku.set(normalizeKeyPart(entry.sku), entry);
    const key = imageKey(entry);
    if (key.replace(/\|/g, "")) byProduct.set(key, entry);
  });

  return { bySku, byProduct };
}

function getKordataProducts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.products)) return payload.products;
  return [];
}

function getMissingFields(product) {
  const missing = publicableRequirements.filter((field) => !normalizeText(product[field]));
  if (!["COMPLETO", "PUBLICADO"].includes(product.estado_enriquecimiento)) missing.push("estado_enriquecimiento");
  if (!(Number(product.disponibleTotal) > 0)) missing.push("disponibleTotal");
  return missing;
}

function resolveImage(kordataProduct, enrichment, imageIndex) {
  const enrichmentImage = normalizeText(enrichment?.imagen_principal);
  const enrichmentGallery = splitList(enrichment?.galeria);
  if (enrichmentImage) {
    return {
      imagen_principal: enrichmentImage,
      galeria: enrichmentGallery,
      image_source: "enrichment",
      image_status: "ENRICHMENT"
    };
  }

  const skus = [kordataProduct.sku, ...(kordataProduct.skus || [])].filter(Boolean);
  const bySkuMatch = skus.map((sku) => imageIndex.bySku.get(normalizeKeyPart(sku))).find(Boolean);
  const byProductMatch = imageIndex.byProduct.get(imageKey(kordataProduct));
  const imageMapMatch = bySkuMatch || byProductMatch;

  if (!imageMapMatch) {
    return {
      imagen_principal: "",
      galeria: [],
      image_source: "",
      image_status: "SIN_IMAGEN"
    };
  }

  const localPath = normalizeText(imageMapMatch.local_path);
  const imageUrl = normalizeText(imageMapMatch.image_url);
  const image = localPath || imageUrl;

  return {
    imagen_principal: image,
    galeria: splitList(imageMapMatch.gallery),
    image_source: localPath ? "manual" : imageMapMatch.image_source || "kordata",
    image_status: imageMapMatch.image_status || (image ? "ASIGNADA" : "SIN_IMAGEN"),
    image_map_row: imageMapMatch.__rowNumber
  };
}

function enrichProduct(kordataProduct, enrichment, imageIndex) {
  const categoriaOriginal = kordataProduct.categoria_original || kordataProduct.categoria || "";
  const hasEnrichment = Boolean(enrichment);
  const state = hasEnrichment ? enrichment.estado_enriquecimiento : "PENDIENTE";
  const nombreComercial = enrichment?.nombre_comercial || kordataProduct.nombre || "";
  const slug = enrichment?.slug || slugify([nombreComercial, kordataProduct.modelo, kordataProduct.color].filter(Boolean).join(" "));
  const precio = Number(kordataProduct.precioDeVenta || kordataProduct.precio || 0);
  const image = resolveImage(kordataProduct, enrichment, imageIndex);

  const product = {
    id: kordataProduct.id || slug || productKey({ ...kordataProduct, categoria_original: categoriaOriginal }).replace(/\|/g, "-"),
    slug,
    modelo: kordataProduct.modelo || "",
    marca: kordataProduct.marca || "",
    color: kordataProduct.color || "",
    categoria_original: categoriaOriginal,
    categoria_comercial: enrichment?.categoria_comercial || "",
    subcategoria_comercial: enrichment?.subcategoria_comercial || "",
    genero: enrichment?.genero || "",
    nombre_comercial: nombreComercial,
    descripcion_corta: enrichment?.descripcion_corta || "",
    descripcion_larga: enrichment?.descripcion_larga || "",
    precio,
    precio_mayorista: parseNumber(enrichment?.precio_mayorista || 0),
    promocion: enrichment?.promocion || "",
    costo: Number(kordataProduct.costo || 0),
    margenCordobas: Number(kordataProduct.margenCordobas || 0),
    margenPorcentual: Number(kordataProduct.margenPorcentual || 0),
    tallasDisponibles: kordataProduct.tallasDisponibles || [],
    existenciaPorTalla: kordataProduct.existenciaPorTalla || [],
    existenciaTotal: Number(kordataProduct.existenciaTotal || 0),
    disponibleTotal: Number(kordataProduct.disponibleTotal || 0),
    existenciaPorSucursal: kordataProduct.existenciaPorSucursal || [],
    nuevo: parseBoolean(enrichment?.nuevo),
    destacado: parseBoolean(enrichment?.destacado),
    etiquetas: splitList(enrichment?.etiquetas),
    imagen_principal: image.imagen_principal,
    galeria: image.galeria,
    video_url: enrichment?.video_url || "",
    image_source: image.image_source,
    image_status: image.image_status,
    estado_enriquecimiento: state,
    fuente_datos: "Kordata + STYLUS",
    publicable: false,
    enrichment: {
      matched: hasEnrichment,
      sourceRow: enrichment?.__rowNumber || null,
      notas: enrichment?.notas || ""
    },
    image: {
      source: image.image_source,
      status: image.image_status,
      imageMapRow: image.image_map_row || null
    }
  };

  product.publicable = getMissingFields(product).length === 0;
  return product;
}

function analyzeProducts(products, enrichmentRows, imageRows, duplicateKeys, invalidStates) {
  const productsWithEnrichment = products.filter((product) => product.enrichment.matched);
  const productsWithoutEnrichment = products.filter((product) => !product.enrichment.matched);
  const publicableProducts = products.filter((product) => product.publicable);
  const pendingProducts = products.filter((product) => product.estado_enriquecimiento === "PENDIENTE" || !product.publicable);
  const missingData = products.map((product) => ({ product, missing: getMissingFields(product) })).filter((item) => item.missing.length);

  return {
    generatedAt: new Date().toISOString(),
    source: {
      kordata: "catalog-data/exports/kordata-products.generated.json",
      enrichment: "catalog-data/enrichment/products.enrichment.csv"
    },
    output: "catalog-data/exports/stylus-products.enriched.json",
    publicCatalogTouched: false,
    totals: {
      kordataProducts: products.length,
      enrichmentRows: enrichmentRows.length,
      imageRows: imageRows.length,
      productsWithEnrichment: productsWithEnrichment.length,
      productsWithoutEnrichment: productsWithoutEnrichment.length,
      publicableProducts: publicableProducts.length,
      pendingProducts: pendingProducts.length,
      missingDataProducts: missingData.length,
      duplicateEnrichmentKeys: duplicateKeys.length,
      invalidEnrichmentStates: invalidStates.length
    },
    productsWithEnrichment,
    productsWithoutEnrichment,
    publicableProducts,
    pendingProducts,
    missingData,
    duplicateKeys,
    invalidStates
  };
}

function analyzeImages(products, imageRows) {
  return {
    generatedAt: new Date().toISOString(),
    source: "catalog-data/images/image-map.csv",
    totals: {
      imageMapRows: imageRows.length,
      products: products.length,
      withImage: products.filter((product) => product.imagen_principal).length,
      missingImage: products.filter((product) => !product.imagen_principal).length,
      fromKordata: products.filter((product) => product.image_source === "kordata" || product.image_source === "azure_blob").length,
      manual: products.filter((product) => product.image_source === "manual").length,
      fromEnrichment: products.filter((product) => product.image_source === "enrichment").length
    },
    missing: products.filter((product) => !product.imagen_principal),
    fromKordata: products.filter((product) => product.image_source === "kordata" || product.image_source === "azure_blob"),
    manual: products.filter((product) => product.image_source === "manual"),
    fromEnrichment: products.filter((product) => product.image_source === "enrichment")
  };
}

function renderSummary(report) {
  return [
    "# Resumen de enriquecimiento comercial STYLUS",
    "",
    `- Generado: ${report.generatedAt}`,
    `- Fuente Kordata: \`${report.source.kordata}\``,
    `- Base STYLUS: \`${report.source.enrichment}\``,
    `- Salida enriquecida: \`${report.output}\``,
    "- Catalogo publico: `data/products.json` no fue modificado.",
    "",
    "## Totales",
    "",
    `- Productos Kordata: ${report.totals.kordataProducts}`,
    `- Filas de enriquecimiento: ${report.totals.enrichmentRows}`,
    `- Filas de mapa de imagenes: ${report.totals.imageRows}`,
    `- Productos con enriquecimiento: ${report.totals.productsWithEnrichment}`,
    `- Productos sin enriquecimiento: ${report.totals.productsWithoutEnrichment}`,
    `- Productos publicables: ${report.totals.publicableProducts}`,
    `- Productos pendientes: ${report.totals.pendingProducts}`,
    `- Productos con campos faltantes: ${report.totals.missingDataProducts}`,
    `- Llaves de enriquecimiento duplicadas: ${report.totals.duplicateEnrichmentKeys}`,
    `- Estados de enriquecimiento invalidos: ${report.totals.invalidEnrichmentStates}`,
    ""
  ].join("\n");
}

function renderImagesSummary(report) {
  return [
    "# Resumen de imagenes STYLUS",
    "",
    `- Generado: ${report.generatedAt}`,
    `- Fuente: \`${report.source}\``,
    `- Filas en mapa de imagenes: ${report.totals.imageMapRows}`,
    `- Productos evaluados: ${report.totals.products}`,
    `- Productos con imagen: ${report.totals.withImage}`,
    `- Productos sin imagen: ${report.totals.missingImage}`,
    `- Imagenes desde Kordata/Azure: ${report.totals.fromKordata}`,
    `- Imagenes manuales STYLUS: ${report.totals.manual}`,
    `- Imagenes desde enrichment: ${report.totals.fromEnrichment}`,
    ""
  ].join("\n");
}

function renderImagesMissing(report) {
  return [
    "# Productos sin imagen",
    "",
    report.missing.length
      ? table(
          ["Modelo", "Marca", "Color", "Categoria original", "Estado enriquecimiento"],
          report.missing.map((product) => [
            product.modelo,
            product.marca,
            product.color,
            product.categoria_original,
            product.estado_enriquecimiento
          ])
        )
      : "No hay productos sin imagen.\n"
  ].join("\n");
}

function renderImagesFromKordata(report) {
  return [
    "# Imagenes desde Kordata / Azure Blob Storage",
    "",
    report.fromKordata.length
      ? table(
          ["Modelo", "Marca", "Color", "Imagen", "Estado"],
          report.fromKordata.map((product) => [
            product.modelo,
            product.marca,
            product.color,
            product.imagen_principal,
            product.image_status
          ])
        )
      : "No hay productos usando imagenes desde Kordata/Azure.\n"
  ].join("\n");
}

function renderImagesManual(report) {
  return [
    "# Imagenes manuales STYLUS",
    "",
    report.manual.length
      ? table(
          ["Modelo", "Marca", "Color", "Imagen", "Estado"],
          report.manual.map((product) => [
            product.modelo,
            product.marca,
            product.color,
            product.imagen_principal,
            product.image_status
          ])
        )
      : "No hay productos usando imagenes manuales STYLUS.\n"
  ].join("\n");
}

function renderMissingData(report) {
  return [
    "# Campos faltantes de enriquecimiento",
    "",
    report.missingData.length
      ? table(
          ["Modelo", "Marca", "Color", "Categoria original", "Estado", "Campos faltantes"],
          report.missingData.map(({ product, missing }) => [
            product.modelo,
            product.marca,
            product.color,
            product.categoria_original,
            product.estado_enriquecimiento,
            missing.join(", ")
          ])
        )
      : "No se encontraron campos faltantes para publicacion.\n",
    report.invalidStates.length ? ["", "## Estados invalidos", "", renderInvalidStates(report.invalidStates)].join("\n") : ""
  ].join("\n");
}

function renderReadyToPublish(report) {
  return [
    "# Productos listos para publicacion",
    "",
    report.publicableProducts.length
      ? table(
          ["Slug", "Modelo", "Marca", "Color", "Categoria comercial", "Disponible"],
          report.publicableProducts.map((product) => [
            product.slug,
            product.modelo,
            product.marca,
            product.color,
            product.categoria_comercial,
            product.disponibleTotal
          ])
        )
      : "No hay productos publicables todavia.\n"
  ].join("\n");
}

function renderPending(report) {
  return [
    "# Productos pendientes de enriquecimiento",
    "",
    report.pendingProducts.length
      ? table(
          ["Modelo", "Marca", "Color", "Categoria original", "Estado", "Tiene enriquecimiento", "Publicable"],
          report.pendingProducts.map((product) => [
            product.modelo,
            product.marca,
            product.color,
            product.categoria_original,
            product.estado_enriquecimiento,
            product.enrichment.matched ? "si" : "no",
            product.publicable ? "si" : "no"
          ])
        )
      : "No hay productos pendientes.\n"
  ].join("\n");
}

function renderInvalidStates(invalidStates) {
  return table(
    ["Fila CSV", "Llave", "Estado", "Mensaje"],
    invalidStates.map((issue) => [issue.row, issue.key, issue.state, issue.message])
  );
}

function table(headers, rows) {
  if (!rows.length) return "Sin datos.\n";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`),
    ""
  ].join("\n");
}

async function main() {
  const [kordataText, enrichmentText] = await Promise.all([
    readFile(kordataInputPath, "utf8"),
    readFile(enrichmentInputPath, "utf8")
  ]);
  const imageMapText = await readFile(imageMapInputPath, "utf8").catch(() => requiredImageMapColumns.join(","));

  const kordataPayload = JSON.parse(kordataText);
  const kordataProducts = getKordataProducts(kordataPayload);
  const enrichmentRows = validateEnrichmentHeaders(parseCsv(enrichmentText), enrichmentText);
  const imageRows = validateImageMapHeaders(parseCsv(imageMapText), imageMapText);
  const { index, duplicateKeys, invalidStates } = buildEnrichmentIndex(enrichmentRows);
  const imageIndex = buildImageIndex(imageRows);
  const products = kordataProducts.map((product) => enrichProduct(product, index.get(productKey(product)), imageIndex));
  const report = analyzeProducts(products, enrichmentRows, imageRows, duplicateKeys, invalidStates);
  const imageReport = analyzeImages(products, imageRows);

  await mkdir(path.dirname(enrichedOutputPath), { recursive: true });
  await mkdir(reportsDir, { recursive: true });
  await writeFile(enrichedOutputPath, `${JSON.stringify({ ...report, products }, null, 2)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "enrichment-summary.md"), `${renderSummary(report)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "enrichment-missing-data.md"), `${renderMissingData(report)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "enrichment-ready-to-publish.md"), `${renderReadyToPublish(report)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "enrichment-pending.md"), `${renderPending(report)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "images-summary.md"), `${renderImagesSummary(imageReport)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "images-missing.md"), `${renderImagesMissing(imageReport)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "images-from-kordata.md"), `${renderImagesFromKordata(imageReport)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "images-manual.md"), `${renderImagesManual(imageReport)}\n`, "utf8");

  console.log(
    `Enriquecimiento STYLUS generado: ${products.length} productos, ${report.totals.productsWithEnrichment} con enriquecimiento, ${report.totals.publicableProducts} publicables.`
  );
  console.log("data/products.json no fue modificado.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
