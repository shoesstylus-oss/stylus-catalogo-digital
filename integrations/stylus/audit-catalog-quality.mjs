import { constants as fsConstants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

const enrichedInputPath = path.join(rootDir, "catalog-data", "exports", "stylus-products.enriched.json");
const kordataInputPath = path.join(rootDir, "catalog-data", "exports", "kordata-products.generated.json");
const enrichmentInputPath = path.join(rootDir, "catalog-data", "enrichment", "products.enrichment.csv");
const imageMapInputPath = path.join(rootDir, "catalog-data", "images", "image-map.csv");
const qualityOutputPath = path.join(rootDir, "catalog-data", "exports", "catalog-quality.generated.json");
const reportsDir = path.join(rootDir, "catalog-data", "reports");

const reportPaths = {
  summary: path.join(reportsDir, "quality-summary.md"),
  byBrand: path.join(reportsDir, "quality-by-brand.md"),
  byCategory: path.join(reportsDir, "quality-by-category.md"),
  missingImages: path.join(reportsDir, "quality-missing-images.md"),
  highStockMissingImage: path.join(reportsDir, "quality-high-stock-missing-image.md"),
  almostReady: path.join(reportsDir, "quality-almost-ready.md"),
  notPublicable: path.join(reportsDir, "quality-not-publicable.md")
};

const publishFields = [
  "imagen_principal",
  "slug",
  "precio",
  "tallasDisponibles",
  "nombre_comercial",
  "categoria_comercial",
  "genero",
  "descripcion_corta",
  "estado_enriquecimiento",
  "disponibleTotal"
];

function normalizeText(value = "") {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  return normalizeText(value) !== "";
}

function hasStock(product) {
  return Number(product.disponibleTotal || 0) > 0;
}

function hasImage(product) {
  return hasValue(product.imagen_principal);
}

function isCompleteState(product) {
  return ["COMPLETO", "PUBLICADO"].includes(normalizeText(product.estado_enriquecimiento).toUpperCase());
}

function isPendingState(product) {
  return normalizeText(product.estado_enriquecimiento).toUpperCase() === "PENDIENTE";
}

function isReviewState(product) {
  return normalizeText(product.estado_enriquecimiento).toUpperCase() === "EN_REVISION";
}

function imageSource(product) {
  return normalizeText(product.image_source || product.image?.source).toLowerCase();
}

function imageStatus(product) {
  return normalizeText(product.image_status || product.image?.status);
}

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 10000) / 100;
}

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readTextIfExists(filePath) {
  if (!(await fileExists(filePath))) return "";
  return readFile(filePath, "utf8");
}

async function readJsonIfExists(filePath) {
  const text = await readTextIfExists(filePath);
  if (!normalizeText(text)) return null;
  return JSON.parse(text);
}

function getProducts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  return [];
}

function countCsvRows(text) {
  const rows = text.split(/\r?\n/).filter((line) => normalizeText(line));
  return rows.length > 1 ? rows.length - 1 : 0;
}

function getMissingPublishFields(product) {
  return publishFields.filter((field) => {
    if (field === "estado_enriquecimiento") return !isCompleteState(product);
    if (field === "disponibleTotal") return !hasStock(product);
    return !hasValue(product[field]);
  });
}

function qualityScore(product) {
  let score = 0;
  if (hasStock(product)) score += 20;
  if (hasImage(product)) score += 25;
  if (hasValue(product.nombre_comercial)) score += 15;
  if (hasValue(product.categoria_comercial)) score += 10;
  if (hasValue(product.genero)) score += 10;
  if (hasValue(product.descripcion_corta)) score += 10;
  if (isCompleteState(product)) score += 10;
  return score;
}

function normalizeProduct(product) {
  const missingFields = getMissingPublishFields(product);
  return {
    modelo: normalizeText(product.modelo),
    marca: normalizeText(product.marca),
    color: normalizeText(product.color),
    categoria_original: normalizeText(product.categoria_original || product.categoria),
    categoria_comercial: normalizeText(product.categoria_comercial),
    genero: normalizeText(product.genero),
    nombre_comercial: normalizeText(product.nombre_comercial),
    descripcion_corta: normalizeText(product.descripcion_corta),
    descripcion_larga: normalizeText(product.descripcion_larga),
    imagen_principal: normalizeText(product.imagen_principal),
    image_source: imageSource(product),
    image_status: imageStatus(product),
    tallasDisponibles: Array.isArray(product.tallasDisponibles) ? product.tallasDisponibles : [],
    disponibleTotal: Number(product.disponibleTotal || 0),
    existenciaTotal: Number(product.existenciaTotal || 0),
    estado_enriquecimiento: normalizeText(product.estado_enriquecimiento || "PENDIENTE").toUpperCase(),
    publicable: product.publicable === true,
    slug: normalizeText(product.slug),
    precio: product.precio,
    missingFields,
    quality_score: qualityScore(product)
  };
}

function summarizeGroup(products, key) {
  const groups = new Map();
  products.forEach((product) => {
    const value = normalizeText(product[key]) || "SIN_DATO";
    const entry = groups.get(value) || {
      name: value,
      totalProductos: 0,
      conStock: 0,
      conImagen: 0,
      sinImagen: 0,
      publicables: 0,
      coberturaImagenPorcentaje: 0,
      publicablesPorcentaje: 0
    };

    entry.totalProductos += 1;
    if (hasStock(product)) entry.conStock += 1;
    if (hasImage(product)) entry.conImagen += 1;
    if (!hasImage(product)) entry.sinImagen += 1;
    if (product.publicable) entry.publicables += 1;
    groups.set(value, entry);
  });

  return [...groups.values()]
    .map((entry) => ({
      ...entry,
      coberturaImagenPorcentaje: percent(entry.conImagen, entry.totalProductos),
      publicablesPorcentaje: percent(entry.publicables, entry.totalProductos)
    }))
    .sort((left, right) => right.totalProductos - left.totalProductos || left.name.localeCompare(right.name));
}

function buildAudit(products, sources) {
  const normalizedProducts = products.map(normalizeProduct);
  const total = normalizedProducts.length;
  const withStock = normalizedProducts.filter(hasStock);
  const withoutStock = normalizedProducts.filter((product) => !hasStock(product));
  const withImage = normalizedProducts.filter(hasImage);
  const withoutImage = normalizedProducts.filter((product) => !hasImage(product));
  const complete = normalizedProducts.filter(isCompleteState);
  const pending = normalizedProducts.filter(isPendingState);
  const review = normalizedProducts.filter(isReviewState);
  const publicable = normalizedProducts.filter((product) => product.publicable);
  const notPublicable = normalizedProducts
    .filter((product) => !product.publicable)
    .map((product) => ({ ...product, missingFields: product.missingFields }));
  const missingImages = normalizedProducts.filter((product) => hasStock(product) && !hasImage(product));
  const highStockMissingImage = [...missingImages].sort((left, right) => right.disponibleTotal - left.disponibleTotal).slice(0, 50);
  const almostReady = normalizedProducts
    .filter((product) => hasStock(product))
    .filter((product) => hasImage(product))
    .filter((product) => hasValue(product.nombre_comercial))
    .filter((product) => hasValue(product.categoria_comercial))
    .filter((product) => !product.publicable)
    .filter((product) => product.missingFields.length > 0 && product.missingFields.length <= 3)
    .sort((left, right) => right.quality_score - left.quality_score || right.disponibleTotal - left.disponibleTotal);

  const totals = {
    totalProductosEvaluados: total,
    productosConStock: withStock.length,
    productosSinStock: withoutStock.length,
    productosConImagen: withImage.length,
    productosSinImagen: withoutImage.length,
    productosConImagenKordataAzure: normalizedProducts.filter((product) => ["kordata", "azure_blob"].includes(product.image_source)).length,
    productosConImagenManualStylus: normalizedProducts.filter((product) => product.image_source === "manual").length,
    productosConImagenDesdeEnrichment: normalizedProducts.filter((product) => product.image_source === "enrichment").length,
    productosConEnriquecimientoCompleto: complete.length,
    productosPendientes: pending.length,
    productosEnRevision: review.length,
    productosPublicables: publicable.length,
    productosNoPublicables: notPublicable.length,
    porcentajeCoberturaImagen: percent(withImage.length, total),
    porcentajeProductosPublicables: percent(publicable.length, total),
    porcentajeEnriquecimientoCompleto: percent(complete.length, total)
  };

  return {
    generatedAt: new Date().toISOString(),
    source: sources,
    publicCatalogTouched: false,
    totals,
    byBrand: summarizeGroup(normalizedProducts, "marca"),
    byCategory: summarizeGroup(normalizedProducts, "categoria_original"),
    productsWithQualityScore: normalizedProducts.sort(
      (left, right) => right.quality_score - left.quality_score || right.disponibleTotal - left.disponibleTotal
    ),
    missingImages,
    highStockMissingImage,
    almostReady,
    notPublicable
  };
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

function renderSummary(audit, emptyMessage = "") {
  const { totals } = audit;
  return [
    "# Auditor de calidad del catalogo STYLUS",
    "",
    `- Generado: ${audit.generatedAt}`,
    "- Fuente principal: `catalog-data/exports/stylus-products.enriched.json`",
    "- Catalogo publico: `data/products.json` no fue modificado.",
    "- Backup publico: `data/products.backup.json` no fue modificado.",
    emptyMessage ? `- Estado: ${emptyMessage}` : "",
    "",
    "## Indicadores generales",
    "",
    `- Total de productos evaluados: ${totals.totalProductosEvaluados}`,
    `- Productos con stock: ${totals.productosConStock}`,
    `- Productos sin stock: ${totals.productosSinStock}`,
    `- Productos con imagen: ${totals.productosConImagen}`,
    `- Productos sin imagen: ${totals.productosSinImagen}`,
    `- Imagen Kordata/Azure: ${totals.productosConImagenKordataAzure}`,
    `- Imagen manual STYLUS: ${totals.productosConImagenManualStylus}`,
    `- Imagen desde enrichment: ${totals.productosConImagenDesdeEnrichment}`,
    `- Enriquecimiento completo: ${totals.productosConEnriquecimientoCompleto}`,
    `- Pendientes: ${totals.productosPendientes}`,
    `- En revision: ${totals.productosEnRevision}`,
    `- Publicables: ${totals.productosPublicables}`,
    `- No publicables: ${totals.productosNoPublicables}`,
    `- Cobertura de imagen: ${totals.porcentajeCoberturaImagen}%`,
    `- Productos publicables: ${totals.porcentajeProductosPublicables}%`,
    `- Enriquecimiento completo: ${totals.porcentajeEnriquecimientoCompleto}%`,
    ""
  ].join("\n");
}

function renderByGroup(title, rows) {
  return [
    `# ${title}`,
    "",
    table(
      ["Nombre", "Total", "Con stock", "Con imagen", "Sin imagen", "Publicables", "Cobertura imagen %", "Publicables %"],
      rows.map((entry) => [
        entry.name,
        entry.totalProductos,
        entry.conStock,
        entry.conImagen,
        entry.sinImagen,
        entry.publicables,
        entry.coberturaImagenPorcentaje,
        entry.publicablesPorcentaje
      ])
    )
  ].join("\n");
}

function renderProductRows(title, products, extraHeaders = [], extraValues = () => []) {
  return [
    `# ${title}`,
    "",
    table(
      [
        "Modelo",
        "Marca",
        "Color",
        "Categoria original",
        "Categoria comercial",
        "Disponible",
        "Imagen",
        "Estado",
        "Publicable",
        "Quality score",
        ...extraHeaders
      ],
      products.map((product) => [
        product.modelo,
        product.marca,
        product.color,
        product.categoria_original,
        product.categoria_comercial,
        product.disponibleTotal,
        product.imagen_principal || "SIN_IMAGEN",
        product.estado_enriquecimiento,
        product.publicable ? "si" : "no",
        product.quality_score,
        ...extraValues(product)
      ])
    )
  ].join("\n");
}

async function writeReports(audit, emptyMessage) {
  await mkdir(path.dirname(qualityOutputPath), { recursive: true });
  await mkdir(reportsDir, { recursive: true });
  await writeFile(qualityOutputPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(reportPaths.summary, `${renderSummary(audit, emptyMessage)}\n`, "utf8");
  await writeFile(reportPaths.byBrand, `${renderByGroup("Calidad por marca", audit.byBrand)}\n`, "utf8");
  await writeFile(reportPaths.byCategory, `${renderByGroup("Calidad por categoria original", audit.byCategory)}\n`, "utf8");
  await writeFile(
    reportPaths.missingImages,
    `${renderProductRows("Productos con stock y sin imagen", audit.missingImages)}\n`,
    "utf8"
  );
  await writeFile(
    reportPaths.highStockMissingImage,
    `${renderProductRows("Top 50 productos con mayor stock y sin imagen", audit.highStockMissingImage)}\n`,
    "utf8"
  );
  await writeFile(
    reportPaths.almostReady,
    `${renderProductRows("Productos casi listos para publicar", audit.almostReady, ["Campos faltantes"], (product) => [
      product.missingFields.join(", ")
    ])}\n`,
    "utf8"
  );
  await writeFile(
    reportPaths.notPublicable,
    `${renderProductRows("Productos no publicables", audit.notPublicable, ["Campos faltantes"], (product) => [
      product.missingFields.join(", ")
    ])}\n`,
    "utf8"
  );
}

async function main() {
  const [enrichedPayload, kordataText, enrichmentText, imageMapText] = await Promise.all([
    readJsonIfExists(enrichedInputPath),
    readTextIfExists(kordataInputPath),
    readTextIfExists(enrichmentInputPath),
    readTextIfExists(imageMapInputPath)
  ]);

  const products = getProducts(enrichedPayload);
  const emptyMessage =
    products.length === 0
      ? "No hay productos enriquecidos para auditar. Ejecuta antes `npm run import:kordata` y `npm run enrich:products`."
      : "";
  const audit = buildAudit(products, {
    enriched: "catalog-data/exports/stylus-products.enriched.json",
    kordata: "catalog-data/exports/kordata-products.generated.json",
    enrichment: "catalog-data/enrichment/products.enrichment.csv",
    imageMap: "catalog-data/images/image-map.csv",
    metadata: {
      kordataFilePresent: normalizeText(kordataText) !== "",
      enrichmentRows: countCsvRows(enrichmentText),
      imageMapRows: countCsvRows(imageMapText)
    }
  });

  await writeReports(audit, emptyMessage);

  if (emptyMessage) console.warn(emptyMessage);
  console.log(`Auditoria de calidad STYLUS generada: ${audit.totals.totalProductosEvaluados} productos evaluados.`);
  console.log("data/products.json no fue modificado.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
