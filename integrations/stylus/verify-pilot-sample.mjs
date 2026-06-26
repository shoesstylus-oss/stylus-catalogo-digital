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
const tmpDir = path.join(os.tmpdir(), `stylus-pilot-sample-${Date.now()}`);

const filesToRestore = [
  "data/products.json",
  "catalog-data/exports/kordata-products.generated.json",
  "catalog-data/pilot/stylus-pilot-10.generated.csv",
  "catalog-data/enrichment/products.enrichment.csv",
  "catalog-data/images/image-map.csv",
  "catalog-data/reports/pilot-10-summary.md"
];

const createPilotPath = path.join(rootDir, "integrations", "stylus", "create-pilot-batch.mjs");
const publicCatalogPath = path.join(rootDir, "data", "products.json");
const kordataOutputPath = path.join(rootDir, "catalog-data", "exports", "kordata-products.generated.json");
const pilotOutputPath = path.join(rootDir, "catalog-data", "pilot", "stylus-pilot-10.generated.csv");
const enrichmentCsvPath = path.join(rootDir, "catalog-data", "enrichment", "products.enrichment.csv");
const imageMapPath = path.join(rootDir, "catalog-data", "images", "image-map.csv");
const pilotReportPath = path.join(rootDir, "catalog-data", "reports", "pilot-10-summary.md");

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
  if (!rows.length) return { headers: [], data: [] };

  const [headers, ...dataRows] = rows;
  return {
    headers,
    data: dataRows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])))
  };
}

function sampleProduct({ modelo, marca = "STYLUS", color = "Negro", categoria = "Tenis", disponibleTotal }) {
  return {
    id: modelo?.toLowerCase() || "sin-modelo",
    modelo,
    marca,
    color,
    categoria,
    skus: [`${modelo || "SIN"}-37`],
    tallasDisponibles: ["37", "38"],
    existenciaPorTalla: [{ talla: "37", existencia: disponibleTotal, disponible: disponibleTotal, reservado: 0 }],
    existenciaTotal: disponibleTotal,
    disponibleTotal,
    existenciaPorSucursal: [{ ubicacion: "STYLUS Centro", existencia: disponibleTotal, disponible: disponibleTotal, reservado: 0 }],
    precioDeVenta: 1200,
    costo: 999999
  };
}

function fixtureProducts() {
  return [
    sampleProduct({ modelo: "PIL-01", disponibleTotal: 50 }),
    sampleProduct({ modelo: "PIL-02", disponibleTotal: 45 }),
    sampleProduct({ modelo: "PIL-03", disponibleTotal: 40 }),
    sampleProduct({ modelo: "PIL-04", disponibleTotal: 35 }),
    sampleProduct({ modelo: "PIL-05", disponibleTotal: 30 }),
    sampleProduct({ modelo: "PIL-06", disponibleTotal: 25 }),
    sampleProduct({ modelo: "PIL-07", disponibleTotal: 20 }),
    sampleProduct({ modelo: "PIL-08", disponibleTotal: 15 }),
    sampleProduct({ modelo: "PIL-09", disponibleTotal: 12 }),
    sampleProduct({ modelo: "PIL-10", disponibleTotal: 11 }),
    sampleProduct({ modelo: "PIL-11", disponibleTotal: 10 }),
    sampleProduct({ modelo: "PIL-12", disponibleTotal: 9 }),
    sampleProduct({ modelo: "PIL-DUP", disponibleTotal: 8 }),
    sampleProduct({ modelo: "PIL-DUP", disponibleTotal: 60 }),
    sampleProduct({ modelo: "PIL-ZERO", disponibleTotal: 0 }),
    sampleProduct({ modelo: "PIL-NEG", disponibleTotal: -2 }),
    sampleProduct({ modelo: "", disponibleTotal: 80 }),
    sampleProduct({ modelo: "PIL-NOBRAND", marca: "", disponibleTotal: 70 })
  ];
}

await backupFiles();

const publicCatalogBefore = await sha256(publicCatalogPath);
const enrichmentBefore = await sha256(enrichmentCsvPath);
const imageMapBefore = await sha256(imageMapPath);
const pilotOutputExistedBefore = await fileExists(pilotOutputPath);
const pilotOutputBefore = pilotOutputExistedBefore ? await sha256(pilotOutputPath) : "";
const pilotReportExistedBefore = await fileExists(pilotReportPath);
const pilotReportBefore = pilotReportExistedBefore ? await sha256(pilotReportPath) : "";

try {
  const kordataPayload = {
    generatedAt: new Date().toISOString(),
    products: fixtureProducts()
  };

  await writeFile(kordataOutputPath, `${JSON.stringify(kordataPayload, null, 2)}\n`, "utf8");
  await execFileAsync(nodeBin, [createPilotPath], { cwd: rootDir });

  const pilotCsv = await readFile(pilotOutputPath, "utf8");
  const { headers, data } = parseCsv(pilotCsv);
  const selectedModels = data.map((row) => row.modelo);

  assert(data.length === 10, `El piloto debia seleccionar maximo 10 modelos; selecciono ${data.length}.`);
  assert(!headers.includes("costo"), "El CSV piloto no debe incluir columna de costo.");
  assert(!headers.includes("costo_real"), "El CSV piloto no debe incluir columna de costo_real.");
  assert(!selectedModels.includes("PIL-ZERO"), "El piloto incluyo un producto sin disponibilidad positiva.");
  assert(!selectedModels.includes("PIL-NEG"), "El piloto incluyo un producto con disponibilidad negativa.");
  assert(!selectedModels.includes(""), "El piloto incluyo un producto sin modelo.");
  assert(!selectedModels.includes("PIL-NOBRAND"), "El piloto incluyo un producto sin marca.");
  assert(selectedModels.filter((modelo) => modelo === "PIL-DUP").length === 1, "El piloto no elimino duplicados por modelo.");
  assert(
    selectedModels.join(",") === "PIL-DUP,PIL-01,PIL-02,PIL-03,PIL-04,PIL-05,PIL-06,PIL-07,PIL-08,PIL-09",
    `Orden inesperado por disponibilidad: ${selectedModels.join(",")}.`
  );

  const pilotReport = await readFile(pilotReportPath, "utf8");
  assert(pilotReport.includes("PIL-DUP"), "El reporte piloto debia incluir el modelo duplicado seleccionado.");
  assert(pilotReport.includes("Disponibilidad total"), "El reporte piloto debia incluir disponibilidad total.");

  assert((await sha256(publicCatalogPath)) === publicCatalogBefore, "La prueba modifico data/products.json.");
  assert((await sha256(enrichmentCsvPath)) === enrichmentBefore, "La prueba modifico products.enrichment.csv.");
  assert((await sha256(imageMapPath)) === imageMapBefore, "La prueba modifico image-map.csv.");

  await restoreFiles();
  assert((await sha256(publicCatalogPath)) === publicCatalogBefore, "data/products.json no quedo restaurado.");
  assert((await sha256(enrichmentCsvPath)) === enrichmentBefore, "products.enrichment.csv no quedo restaurado.");
  assert((await sha256(imageMapPath)) === imageMapBefore, "image-map.csv no quedo restaurado.");
  assert((await fileExists(pilotOutputPath)) === pilotOutputExistedBefore, "El output piloto no conservo su estado de existencia original.");
  assert((await fileExists(pilotReportPath)) === pilotReportExistedBefore, "El reporte piloto no conservo su estado de existencia original.");
  if (pilotOutputExistedBefore) assert((await sha256(pilotOutputPath)) === pilotOutputBefore, "El output piloto no quedo restaurado.");
  if (pilotReportExistedBefore) assert((await sha256(pilotReportPath)) === pilotReportBefore, "El reporte piloto no quedo restaurado.");

  console.log("Prueba pilot sample OK: seleccion, orden, duplicados, CSV sin costo y restauracion verificados.");
  console.log("data/products.json, products.enrichment.csv e image-map.csv no fueron modificados.");
} finally {
  await restoreFiles();
}
