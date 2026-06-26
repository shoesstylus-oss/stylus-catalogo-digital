import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { access, copyFile, mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const nodeBin = process.execPath;
const tmpDir = path.join(os.tmpdir(), `stylus-publisher-sample-${Date.now()}`);

const filesToRestore = [
  "data/products.json",
  "data/products.backup.json",
  "catalog-data/exports/kordata-products.generated.json",
  "catalog-data/exports/stylus-products.enriched.json",
  "catalog-data/exports/products.preview.json",
  "catalog-data/enrichment/products.enrichment.csv",
  "catalog-data/reports/kordata-summary.md",
  "catalog-data/reports/kordata-stock-by-branch.md",
  "catalog-data/reports/kordata-missing-data.md",
  "catalog-data/reports/kordata-low-stock.md",
  "catalog-data/reports/enrichment-summary.md",
  "catalog-data/reports/enrichment-missing-data.md",
  "catalog-data/reports/enrichment-ready-to-publish.md",
  "catalog-data/reports/enrichment-pending.md",
  "catalog-data/reports/images-summary.md",
  "catalog-data/reports/images-missing.md",
  "catalog-data/reports/images-from-kordata.md",
  "catalog-data/reports/images-manual.md",
  "catalog-data/reports/publish-preview.md",
  "catalog-data/reports/publish-result.md"
];

const importKordataPath = path.join(rootDir, "integrations", "kordata", "import-kordata-inventory.mjs");
const enrichProductsPath = path.join(rootDir, "integrations", "stylus", "enrich-products.mjs");
const publishProductsPath = path.join(rootDir, "integrations", "stylus", "publish-products.mjs");
const kordataSamplePath = path.join(rootDir, "catalog-data", "kordata", "samples", "kordata-inventory.sample.xlsx");
const enrichmentTemplatePath = path.join(rootDir, "catalog-data", "enrichment", "products.enrichment.template.csv");
const enrichmentCsvPath = path.join(rootDir, "catalog-data", "enrichment", "products.enrichment.csv");
const enrichedOutputPath = path.join(rootDir, "catalog-data", "exports", "stylus-products.enriched.json");
const previewOutputPath = path.join(rootDir, "catalog-data", "exports", "products.preview.json");
const publicCatalogPath = path.join(rootDir, "data", "products.json");
const publicBackupPath = path.join(rootDir, "data", "products.backup.json");

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
    const target = path.join(tmpDir, relativePath);
    if (await fileExists(source)) {
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(source, target);
      continue;
    }
    await mkdir(path.dirname(target), { recursive: true });
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

async function runNode(scriptPath, args = [], expectFailure = false) {
  try {
    const result = await execFileAsync(nodeBin, [scriptPath, ...args], { cwd: rootDir });
    if (expectFailure) throw new Error(`Se esperaba fallo, pero el comando termino OK: ${scriptPath} ${args.join(" ")}`);
    return result;
  } catch (error) {
    if (!expectFailure) throw error;
    return error;
  }
}

function readJson(filePath) {
  return readFile(filePath, "utf8").then((text) => JSON.parse(text));
}

await backupFiles();
const publicCatalogBefore = await sha256(publicCatalogPath);

try {
  await runNode(importKordataPath, ["--input", kordataSamplePath]);
  await copyFile(enrichmentTemplatePath, enrichmentCsvPath);
  await runNode(enrichProductsPath);

  await runNode(publishProductsPath, ["--preview"]);
  const previewProducts = await readJson(previewOutputPath);
  assert(previewProducts.length === 1, `Preview debia generar 1 producto, genero ${previewProducts.length}.`);
  assert((await sha256(publicCatalogPath)) === publicCatalogBefore, "Preview modifico data/products.json.");

  await runNode(publishProductsPath, ["--publish"]);
  const publishedProducts = await readJson(publicCatalogPath);
  assert(publishedProducts.length === 1, `Publish debia generar 1 producto publico, genero ${publishedProducts.length}.`);
  assert(await fileExists(publicBackupPath), "Publish debia crear data/products.backup.json.");

  await restoreFiles();
  const publicCatalogRestored = await sha256(publicCatalogPath);
  assert(publicCatalogRestored === publicCatalogBefore, "data/products.json no quedo igual despues de restaurar.");

  await runNode(publishProductsPath, ["--publish"], true);
  assert((await sha256(publicCatalogPath)) === publicCatalogBefore, "Publish bloqueado modifico data/products.json.");

  console.log("Prueba publisher sample OK: preview/publish controlado, backup, bloqueo y restauracion verificados.");
  console.log("data/products.json queda igual despues de restaurar.");
} finally {
  await restoreFiles();
}
