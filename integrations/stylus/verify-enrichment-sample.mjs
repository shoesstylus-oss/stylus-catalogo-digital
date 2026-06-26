import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { access, copyFile, mkdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const nodeBin = process.execPath;
const tmpDir = path.join(os.tmpdir(), `stylus-enrichment-sample-${Date.now()}`);

const filesToRestore = [
  "catalog-data/exports/kordata-products.generated.json",
  "catalog-data/exports/stylus-products.enriched.json",
  "catalog-data/enrichment/products.enrichment.csv",
  "catalog-data/reports/kordata-summary.md",
  "catalog-data/reports/kordata-stock-by-branch.md",
  "catalog-data/reports/kordata-missing-data.md",
  "catalog-data/reports/kordata-low-stock.md",
  "catalog-data/reports/enrichment-summary.md",
  "catalog-data/reports/enrichment-missing-data.md",
  "catalog-data/reports/enrichment-ready-to-publish.md",
  "catalog-data/reports/enrichment-pending.md"
];

const importKordataPath = path.join(rootDir, "integrations", "kordata", "import-kordata-inventory.mjs");
const enrichProductsPath = path.join(rootDir, "integrations", "stylus", "enrich-products.mjs");
const kordataSamplePath = path.join(rootDir, "catalog-data", "kordata", "samples", "kordata-inventory.sample.xlsx");
const enrichmentTemplatePath = path.join(rootDir, "catalog-data", "enrichment", "products.enrichment.template.csv");
const enrichmentCsvPath = path.join(rootDir, "catalog-data", "enrichment", "products.enrichment.csv");
const enrichedOutputPath = path.join(rootDir, "catalog-data", "exports", "stylus-products.enriched.json");
const publicCatalogPath = path.join(rootDir, "data", "products.json");

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

async function backupFiles() {
  await mkdir(tmpDir, { recursive: true });
  for (const relativePath of filesToRestore) {
    const source = path.join(rootDir, relativePath);
    if (await fileExists(source)) {
      const target = path.join(tmpDir, relativePath);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(source, target);
    }
  }
}

async function restoreFiles() {
  for (const relativePath of filesToRestore) {
    const backup = path.join(tmpDir, relativePath);
    const target = path.join(rootDir, relativePath);
    if (await fileExists(backup)) {
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(backup, target);
    }
  }
  await rm(tmpDir, { recursive: true, force: true });
}

function findProduct(products, modelo) {
  return products.find((product) => product.modelo === modelo);
}

await backupFiles();
const publicCatalogBefore = await sha256(publicCatalogPath);

try {
  await execFileAsync(nodeBin, [importKordataPath, "--input", kordataSamplePath], { cwd: rootDir });
  await copyFile(enrichmentTemplatePath, enrichmentCsvPath);
  await execFileAsync(nodeBin, [enrichProductsPath], { cwd: rootDir });

  const publicCatalogAfter = await sha256(publicCatalogPath);
  assert(publicCatalogAfter === publicCatalogBefore, "data/products.json fue modificado durante la prueba.");

  const result = JSON.parse(await readFile(enrichedOutputPath, "utf8"));
  assert(result.products.length === 2, `Se esperaban 2 productos enriquecidos, se recibieron ${result.products.length}.`);
  assert(result.totals.productsWithEnrichment === 2, "La plantilla ficticia debia enriquecer los 2 productos de la muestra Kordata.");

  const urbano = findProduct(result.products, "URB-100");
  assert(urbano, "No se encontro URB-100 en la salida enriquecida.");
  assert(urbano.publicable === true, "URB-100 debia quedar publicable = true.");
  assert(urbano.estado_enriquecimiento === "COMPLETO", `URB-100 debia quedar COMPLETO, recibio ${urbano.estado_enriquecimiento}.`);
  assert(urbano.disponibleTotal === 10, `URB-100 debia tener disponibleTotal = 10, recibio ${urbano.disponibleTotal}.`);

  const sandalia = findProduct(result.products, "SAN-200");
  assert(sandalia, "No se encontro SAN-200 en la salida enriquecida.");
  assert(sandalia.estado_enriquecimiento === "EN_REVISION", `SAN-200 debia quedar EN_REVISION, recibio ${sandalia.estado_enriquecimiento}.`);
  assert(sandalia.publicable === false, "SAN-200 debia quedar publicable = false por estado EN_REVISION.");

  console.log("Prueba enrichment sample OK: Kordata sample + plantilla ficticia generan 2 productos; URB-100 publicable y SAN-200 pendiente por EN_REVISION.");
  console.log("data/products.json no fue modificado.");
} finally {
  await restoreFiles();
}
