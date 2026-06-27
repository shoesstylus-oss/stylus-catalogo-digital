import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const importScriptPath = path.join(rootDir, "integrations", "kordata", "import-kordata-images.mjs");
const imageMapPath = path.join(rootDir, "catalog-data", "images", "image-map.csv");
const productsPath = path.join(rootDir, "data", "products.json");
const productsBackupPath = path.join(rootDir, "data", "products.backup.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function hashFile(filePath) {
  if (!existsSync(filePath)) return null;
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cell(column, row, value) {
  if (value === "" || value === undefined || value === null) return "";
  return `<c r="${column}${row}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
}

function sheetRow(rowNumber, values) {
  const columns = ["A", "B", "C", "D", "E"];
  return `<row r="${rowNumber}">${values.map((value, index) => cell(columns[index], rowNumber, value)).join("")}</row>`;
}

function createSheetXml() {
  const rows = [
    sheetRow(1, ["id", "Modelo", "SKU", "Nombre del producto", "imagen"]),
    sheetRow(2, [
      "1001",
      "IMG-100",
      "IMG-100-37",
      "Tenis muestra Azure talla 37",
      "https://pruebablobstorage.blob.core.windows.net/28136/img-100-37.jpg"
    ]),
    sheetRow(3, [
      "1002",
      "IMG-100",
      "IMG-100-38",
      "Tenis muestra Azure talla 38",
      "https://pruebablobstorage.blob.core.windows.net/28136/img-100-38.jpg"
    ]),
    sheetRow(4, ["1003", "NOIMG-200", "NOIMG-200-40", "Producto controlado sin imagen", ""])
  ];

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rows.join("")}</sheetData>
</worksheet>`;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zipEntries(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const dosTime = 0;
  const dosDate = 0x5b21;

  entries.forEach((entry) => {
    const name = Buffer.from(entry.name, "utf8");
    const data = Buffer.from(entry.content, "utf8");
    const crc = crc32(data);

    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);

    localParts.push(local, data);
    centralParts.push(central);
    offset += local.length + data.length;
  });

  const centralStart = offset;
  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function createWorkbookBuffer() {
  return zipEntries([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Productos" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`
    },
    { name: "xl/worksheets/sheet1.xml", content: createSheetXml() }
  ]);
}

function normalizeHeader(value = "") {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseCsv(text) {
  const rows = [];
  let value = "";
  let row = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      value += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cellValue) => cellValue.trim())) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cellValue) => cellValue.trim())) rows.push(row);
  const [headers = [], ...dataRows] = rows;

  return dataRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [normalizeHeader(header), values[index] || ""]))
  );
}

async function backupFile(filePath, backupPath) {
  if (!existsSync(filePath)) return false;
  await copyFile(filePath, backupPath);
  return true;
}

async function restoreFile(filePath, backupPath, existed) {
  if (existed) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await copyFile(backupPath, filePath);
    return;
  }

  if (existsSync(filePath)) await rm(filePath, { force: true });
}

async function main() {
  const tempDir = await mkdtemp(path.join(tmpdir(), "stylus-kordata-images-"));
  const samplePath = path.join(tempDir, "kordata-images-sample.xlsx");
  const imageMapBackupPath = path.join(tempDir, "image-map.csv.bak");
  const productsBackupCopyPath = path.join(tempDir, "products.json.bak");
  const productsBackupBackupPath = path.join(tempDir, "products.backup.json.bak");

  const imageMapExisted = await backupFile(imageMapPath, imageMapBackupPath);
  const productsExisted = await backupFile(productsPath, productsBackupCopyPath);
  const productsBackupExisted = await backupFile(productsBackupPath, productsBackupBackupPath);
  const productsHashBefore = await hashFile(productsPath);
  const productsBackupHashBefore = await hashFile(productsBackupPath);

  try {
    await writeFile(samplePath, createWorkbookBuffer());

    const { stdout, stderr } = await execFileAsync(process.execPath, [importScriptPath, "--input", samplePath], {
      cwd: rootDir,
      windowsHide: true
    });

    if (stderr.trim()) console.error(stderr.trim());

    assert(stdout.includes("Filas leidas: 3"), "La prueba esperaba 3 filas leidas desde la muestra controlada.");
    assert(stdout.includes("Filas con imagen: 2"), "La prueba esperaba 2 filas con imagen.");
    assert(stdout.includes("Columnas detectadas: Productos fila 1"), "No se confirmo deteccion de encabezados.");

    const rows = parseCsv(await readFile(imageMapPath, "utf8"));
    const importedRows = rows.filter((row) => row.sku.startsWith("IMG-100-"));
    const omittedRows = rows.filter((row) => row.sku === "NOIMG-200-40");

    assert(importedRows.length === 2, "image-map.csv debe contener las 2 filas con URL Azure.");
    assert(omittedRows.length === 0, "image-map.csv no debe contener la fila sin imagen.");

    importedRows.forEach((row) => {
      assert(row.image_url.includes("blob.core.windows.net"), `La URL de ${row.sku} no es Azure Blob.`);
      assert(row.image_source === "azure_blob", `image_source incorrecto para ${row.sku}.`);
      assert(row.image_status === "ASIGNADA", `image_status incorrecto para ${row.sku}.`);
    });

    assert((await hashFile(productsPath)) === productsHashBefore, "data/products.json fue modificado.");
    assert((await hashFile(productsBackupPath)) === productsBackupHashBefore, "data/products.backup.json fue modificado.");

    await restoreFile(imageMapPath, imageMapBackupPath, imageMapExisted);
    await restoreFile(productsPath, productsBackupCopyPath, productsExisted);
    await restoreFile(productsBackupPath, productsBackupBackupPath, productsBackupExisted);

    assert((await hashFile(imageMapPath)) === (imageMapExisted ? await hashFile(imageMapBackupPath) : null), "image-map.csv no fue restaurado.");
    assert((await hashFile(productsPath)) === productsHashBefore, "data/products.json no quedo restaurado.");
    assert((await hashFile(productsBackupPath)) === productsBackupHashBefore, "data/products.backup.json no quedo restaurado.");

    console.log("Prueba Kordata imagenes OK.");
    console.log("- Encabezados detectados: id, Modelo, SKU, Nombre del producto, imagen.");
    console.log("- Filas Azure importadas: 2.");
    console.log("- Fila sin imagen omitida: 1.");
    console.log("- data/products.json y data/products.backup.json sin cambios.");
    console.log("- image-map.csv restaurado al finalizar.");
  } finally {
    await restoreFile(imageMapPath, imageMapBackupPath, imageMapExisted).catch(() => {});
    await restoreFile(productsPath, productsBackupCopyPath, productsExisted).catch(() => {});
    await restoreFile(productsBackupPath, productsBackupBackupPath, productsBackupExisted).catch(() => {});
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
