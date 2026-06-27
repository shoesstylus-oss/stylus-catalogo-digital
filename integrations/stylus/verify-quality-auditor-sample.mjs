import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { access, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const nodeBin = process.execPath;
const tmpDir = path.join(os.tmpdir(), `stylus-quality-auditor-sample-${Date.now()}`);

const filesToRestore = [
  "data/products.json",
  "data/products.backup.json",
  "catalog-data/exports/stylus-products.enriched.json",
  "catalog-data/exports/catalog-quality.generated.json",
  "catalog-data/enrichment/products.enrichment.csv",
  "catalog-data/images/image-map.csv",
  "catalog-data/reports/quality-summary.md",
  "catalog-data/reports/quality-by-brand.md",
  "catalog-data/reports/quality-by-category.md",
  "catalog-data/reports/quality-missing-images.md",
  "catalog-data/reports/quality-high-stock-missing-image.md",
  "catalog-data/reports/quality-almost-ready.md",
  "catalog-data/reports/quality-not-publicable.md"
];

const auditPath = path.join(rootDir, "integrations", "stylus", "audit-catalog-quality.mjs");
const publicCatalogPath = path.join(rootDir, "data", "products.json");
const publicBackupPath = path.join(rootDir, "data", "products.backup.json");
const enrichedOutputPath = path.join(rootDir, "catalog-data", "exports", "stylus-products.enriched.json");
const qualityOutputPath = path.join(rootDir, "catalog-data", "exports", "catalog-quality.generated.json");
const enrichmentCsvPath = path.join(rootDir, "catalog-data", "enrichment", "products.enrichment.csv");
const imageMapPath = path.join(rootDir, "catalog-data", "images", "image-map.csv");
const qualitySummaryPath = path.join(rootDir, "catalog-data", "reports", "quality-summary.md");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function optionalSha256(filePath) {
  return (await fileExists(filePath)) ? sha256(filePath) : "MISSING";
}

async function backupFiles() {
  await mkdir(tmpDir, { recursive: true });
  for (const relativePath of filesToRestore) {
    const source = path.join(rootDir, relativePath);
    const target = path.join(tmpDir, relativePath);
    await mkdir(path.dirname(target), { recursive: true });

    if (await fileExists(source)) {
      await copyFile(source, target);
      continue;
    }

    await writeFile(`${target}.missing`, "", "utf8");
  }
}

async function restoreFiles() {
  for (const relativePath of filesToRestore) {
    const backup = path.join(tmpDir, relativePath);
    const missingMarker = `${backup}.missing`;
    const target = path.join(rootDir, relativePath);

    if (await fileExists(backup)) {
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(backup, target);
      continue;
    }

    if (await fileExists(missingMarker)) {
      await rm(target, { force: true });
    }
  }
  await rm(tmpDir, { recursive: true, force: true });
}

function sampleProduct(overrides) {
  return {
    modelo: "AUD-BASE",
    marca: "STYLUS",
    color: "Negro",
    categoria_original: "Tenis",
    categoria_comercial: "",
    genero: "",
    nombre_comercial: "",
    descripcion_corta: "",
    descripcion_larga: "",
    imagen_principal: "",
    image_source: "",
    image_status: "SIN_IMAGEN",
    tallasDisponibles: ["37"],
    disponibleTotal: 0,
    existenciaTotal: 0,
    estado_enriquecimiento: "PENDIENTE",
    publicable: false,
    slug: "",
    precio: 0,
    ...overrides
  };
}

await backupFiles();
const publicCatalogBefore = await sha256(publicCatalogPath);
const publicBackupBefore = await optionalSha256(publicBackupPath);
const enrichmentBefore = await sha256(enrichmentCsvPath);
const imageMapBefore = await sha256(imageMapPath);

try {
  const payload = {
    generatedAt: new Date().toISOString(),
    products: [
      sampleProduct({
        modelo: "AUD-PUB",
        marca: "STYLUS",
        color: "Blanco",
        categoria_original: "Tenis",
        categoria_comercial: "Calzado urbano",
        genero: "Unisex",
        nombre_comercial: "Tenis urbano publico",
        descripcion_corta: "Descripcion corta ficticia.",
        descripcion_larga: "Descripcion larga ficticia.",
        imagen_principal: "assets/products/stylus/aud-pub.jpg",
        image_source: "manual",
        image_status: "APROBADA",
        disponibleTotal: 12,
        existenciaTotal: 12,
        estado_enriquecimiento: "COMPLETO",
        publicable: true,
        slug: "aud-pub",
        precio: 1200
      }),
      sampleProduct({
        modelo: "AUD-NOIMG",
        marca: "STYLUS",
        categoria_original: "Sandalias",
        categoria_comercial: "Calzado casual",
        genero: "Mujer",
        nombre_comercial: "Sandalia sin imagen",
        descripcion_corta: "Descripcion sin imagen.",
        disponibleTotal: 30,
        existenciaTotal: 30,
        estado_enriquecimiento: "COMPLETO",
        slug: "aud-noimg",
        precio: 900
      }),
      sampleProduct({
        modelo: "AUD-ALMOST",
        marca: "NOVA",
        categoria_original: "Botas",
        categoria_comercial: "Botas",
        nombre_comercial: "Bota casi lista",
        imagen_principal: "https://example.invalid/aud-almost.jpg",
        image_source: "azure_blob",
        image_status: "ASIGNADA",
        disponibleTotal: 8,
        existenciaTotal: 8,
        estado_enriquecimiento: "COMPLETO",
        slug: "aud-almost",
        precio: 1500
      }),
      sampleProduct({
        modelo: "AUD-PENDING",
        marca: "NOVA",
        categoria_original: "Tenis",
        imagen_principal: "assets/products/stylus/aud-pending.jpg",
        image_source: "enrichment",
        image_status: "ENRICHMENT",
        disponibleTotal: 0,
        existenciaTotal: 4,
        estado_enriquecimiento: "PENDIENTE"
      })
    ]
  };

  await writeFile(enrichedOutputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await execFileAsync(nodeBin, [auditPath], { cwd: rootDir });

  const audit = JSON.parse(await readFile(qualityOutputPath, "utf8"));
  assert(audit.totals.totalProductosEvaluados === 4, "Total de productos evaluados inesperado.");
  assert(audit.totals.productosConImagen === 3, "Debia detectar 3 productos con imagen.");
  assert(audit.totals.productosSinImagen === 1, "Debia detectar 1 producto sin imagen.");
  assert(audit.totals.productosPublicables === 1, "Debia detectar 1 producto publicable.");
  assert(audit.totals.productosConImagenManualStylus === 1, "Debia detectar 1 imagen manual STYLUS.");
  assert(audit.totals.productosConImagenKordataAzure === 1, "Debia detectar 1 imagen Kordata/Azure.");
  assert(audit.totals.productosConImagenDesdeEnrichment === 1, "Debia detectar 1 imagen desde enrichment.");
  assert(audit.byBrand.find((brand) => brand.name === "STYLUS")?.totalProductos === 2, "Coverage por marca STYLUS incorrecto.");
  assert(audit.byBrand.find((brand) => brand.name === "STYLUS")?.coberturaImagenPorcentaje === 50, "Cobertura por marca STYLUS incorrecta.");
  assert(audit.byCategory.find((category) => category.name === "Tenis")?.totalProductos === 2, "Coverage por categoria Tenis incorrecto.");
  assert(audit.productsWithQualityScore.find((product) => product.modelo === "AUD-PUB")?.quality_score === 100, "Quality score de AUD-PUB debia ser 100.");
  assert(audit.highStockMissingImage[0]?.modelo === "AUD-NOIMG", "highStockMissingImage debia listar AUD-NOIMG.");
  assert(audit.almostReady.some((product) => product.modelo === "AUD-ALMOST"), "almostReady debia listar AUD-ALMOST.");
  assert(audit.notPublicable.some((product) => product.modelo === "AUD-NOIMG"), "notPublicable debia listar AUD-NOIMG.");

  const summary = await readFile(qualitySummaryPath, "utf8");
  assert(summary.includes("Total de productos evaluados: 4"), "quality-summary.md no contiene el total esperado.");
  assert((await sha256(publicCatalogPath)) === publicCatalogBefore, "La prueba modifico data/products.json.");
  assert((await optionalSha256(publicBackupPath)) === publicBackupBefore, "La prueba modifico data/products.backup.json.");
  assert((await sha256(enrichmentCsvPath)) === enrichmentBefore, "La prueba modifico products.enrichment.csv.");
  assert((await sha256(imageMapPath)) === imageMapBefore, "La prueba modifico image-map.csv.");

  console.log("Prueba quality auditor sample OK: totales, imagenes, publicables, coverage, score y rankings verificados.");
  console.log("data/products.json, data/products.backup.json, products.enrichment.csv e image-map.csv no fueron modificados.");
} finally {
  await restoreFiles();
}
