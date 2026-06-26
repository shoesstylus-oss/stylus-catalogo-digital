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
const tmpDir = path.join(os.tmpdir(), `stylus-image-manager-sample-${Date.now()}`);

const filesToRestore = [
  "data/products.json",
  "catalog-data/exports/kordata-products.generated.json",
  "catalog-data/exports/stylus-products.enriched.json",
  "catalog-data/enrichment/products.enrichment.csv",
  "catalog-data/images/image-map.csv",
  "catalog-data/reports/enrichment-summary.md",
  "catalog-data/reports/enrichment-missing-data.md",
  "catalog-data/reports/enrichment-ready-to-publish.md",
  "catalog-data/reports/enrichment-pending.md",
  "catalog-data/reports/images-summary.md",
  "catalog-data/reports/images-missing.md",
  "catalog-data/reports/images-from-kordata.md",
  "catalog-data/reports/images-manual.md"
];

const enrichProductsPath = path.join(rootDir, "integrations", "stylus", "enrich-products.mjs");
const publicCatalogPath = path.join(rootDir, "data", "products.json");
const kordataOutputPath = path.join(rootDir, "catalog-data", "exports", "kordata-products.generated.json");
const enrichmentCsvPath = path.join(rootDir, "catalog-data", "enrichment", "products.enrichment.csv");
const imageMapPath = path.join(rootDir, "catalog-data", "images", "image-map.csv");
const enrichedOutputPath = path.join(rootDir, "catalog-data", "exports", "stylus-products.enriched.json");
const imagesMissingPath = path.join(rootDir, "catalog-data", "reports", "images-missing.md");

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

function findProduct(products, modelo) {
  return products.find((product) => product.modelo === modelo);
}

function sampleKordataProduct(modelo, sku, color) {
  return {
    id: modelo.toLowerCase(),
    modelo,
    marca: "STYLUS",
    color,
    categoria: "Tenis",
    nombre: `${modelo} muestra`,
    skus: [sku],
    tallasDisponibles: ["37"],
    existenciaPorTalla: [{ talla: "37", existencia: 3, disponible: 3, reservado: 0 }],
    existenciaTotal: 3,
    disponibleTotal: 3,
    existenciaPorSucursal: [{ ubicacion: "STYLUS Centro", existencia: 3, disponible: 3, reservado: 0 }],
    precioDeVenta: 1000,
    costo: 0,
    margenCordobas: 0,
    margenPorcentual: 0
  };
}

function enrichmentRow(modelo, color, image = "") {
  return [
    modelo,
    "STYLUS",
    color,
    "Tenis",
    `${modelo} comercial`,
    "Calzado urbano",
    "Tenis casual",
    "Unisex",
    `${modelo} descripcion corta`,
    `${modelo} descripcion larga ficticia.`,
    "0",
    "",
    "no",
    "no",
    "muestra|imagenes",
    image,
    "",
    "",
    `${modelo.toLowerCase()}-comercial`,
    "COMPLETO",
    "Datos ficticios para prueba de prioridad de imagenes."
  ].join(",");
}

await backupFiles();
const publicCatalogBefore = await sha256(publicCatalogPath);

try {
  const kordataPayload = {
    generatedAt: new Date().toISOString(),
    products: [
      sampleKordataProduct("IMG-ENRICH", "IMG-ENRICH-37", "Blanco"),
      sampleKordataProduct("IMG-LOCAL", "IMG-LOCAL-37", "Negro"),
      sampleKordataProduct("IMG-URL", "IMG-URL-37", "Azul"),
      sampleKordataProduct("IMG-MISSING", "IMG-MISSING-37", "Gris")
    ]
  };

  const enrichmentCsv = [
    "modelo,marca,color,categoria_original,nombre_comercial,categoria_comercial,subcategoria_comercial,genero,descripcion_corta,descripcion_larga,precio_mayorista,promocion,nuevo,destacado,etiquetas,imagen_principal,galeria,video_url,slug,estado_enriquecimiento,notas",
    enrichmentRow("IMG-ENRICH", "Blanco", "assets/products/stylus/enrichment-wins.jpg"),
    enrichmentRow("IMG-LOCAL", "Negro"),
    enrichmentRow("IMG-URL", "Azul"),
    enrichmentRow("IMG-MISSING", "Gris")
  ].join("\n");

  const imageMapCsv = [
    "modelo,marca,color,sku,image_source,image_url,local_path,gallery,image_status,notas",
    "IMG-ENRICH,STYLUS,Blanco,IMG-ENRICH-37,manual,https://example.invalid/should-not-win.jpg,assets/products/stylus/should-not-win.jpg,,ASIGNADA,Enrichment debe ganar.",
    "IMG-LOCAL,STYLUS,Negro,IMG-LOCAL-37,manual,https://example.invalid/local-fallback.jpg,assets/products/stylus/local-wins.jpg,assets/products/stylus/local-gallery.jpg,APROBADA,Local path debe ganar sobre URL.",
    "IMG-URL,STYLUS,Azul,IMG-URL-37,azure_blob,https://example.invalid/kordata-azure.jpg,,,ASIGNADA,URL debe usarse si no hay local_path.",
    "IMG-MISSING,STYLUS,Gris,IMG-MISSING-37,manual,,,,PENDIENTE,Sin imagen para validar bloqueo."
  ].join("\n");

  await writeFile(kordataOutputPath, `${JSON.stringify(kordataPayload, null, 2)}\n`, "utf8");
  await writeFile(enrichmentCsvPath, `${enrichmentCsv}\n`, "utf8");
  await writeFile(imageMapPath, `${imageMapCsv}\n`, "utf8");

  await execFileAsync(nodeBin, [enrichProductsPath], { cwd: rootDir });

  const result = JSON.parse(await readFile(enrichedOutputPath, "utf8"));
  assert(result.products.length === 4, `Se esperaban 4 productos, se recibieron ${result.products.length}.`);

  const enrich = findProduct(result.products, "IMG-ENRICH");
  const local = findProduct(result.products, "IMG-LOCAL");
  const url = findProduct(result.products, "IMG-URL");
  const missing = findProduct(result.products, "IMG-MISSING");

  assert(enrich.imagen_principal === "assets/products/stylus/enrichment-wins.jpg", "imagen_principal de enrichment debia ganar sobre image-map.");
  assert(enrich.image_source === "enrichment", "IMG-ENRICH debia indicar fuente enrichment.");
  assert(local.imagen_principal === "assets/products/stylus/local-wins.jpg", "local_path debia usarse cuando enrichment no trae imagen.");
  assert(local.image_source === "manual", "IMG-LOCAL debia indicar fuente manual.");
  assert(url.imagen_principal === "https://example.invalid/kordata-azure.jpg", "image_url debia usarse cuando no hay local_path.");
  assert(url.image_source === "azure_blob", "IMG-URL debia indicar fuente azure_blob.");
  assert(!missing.imagen_principal, "IMG-MISSING no debia tener imagen principal.");
  assert(missing.publicable === false, "Producto sin imagen debia quedar publicable = false.");

  const missingReport = await readFile(imagesMissingPath, "utf8");
  assert(missingReport.includes("IMG-MISSING"), "images-missing.md debia listar IMG-MISSING.");

  assert((await sha256(publicCatalogPath)) === publicCatalogBefore, "La prueba modifico data/products.json.");

  console.log("Prueba image manager sample OK: prioridad enrichment/local_path/image_url y missing verificados.");
  console.log("data/products.json no fue modificado.");
} finally {
  await restoreFiles();
}
