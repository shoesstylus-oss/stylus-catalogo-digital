import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

const defaultInputPath = path.join(rootDir, "catalog-data", "kordata", "Productos (50).xlsx");
const imageMapPath = path.join(rootDir, "catalog-data", "images", "image-map.csv");

const requiredColumns = {
  id: ["id"],
  modelo: ["modelo"],
  sku: ["sku"],
  nombreProducto: ["nombre del producto", "nombredelproducto", "nombre producto", "producto"],
  imagen: ["imagen", "image", "foto", "url imagen", "image url"]
};

const imageMapColumns = [
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

function readOption(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

function getInputPath() {
  const explicit = readOption("--input");
  if (explicit) return path.resolve(rootDir, explicit);
  const positional = process.argv.find((arg, index) => index > 1 && !arg.startsWith("--"));
  return positional ? path.resolve(rootDir, positional) : defaultInputPath;
}

function normalizeText(value = "") {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeHeader(value = "") {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeKeyPart(value = "") {
  return normalizeHeader(value).replace(/[^a-z0-9]+/g, "");
}

function decodeXml(value = "") {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function columnToIndex(cellRef = "") {
  const letters = cellRef.replace(/[^A-Z]/gi, "").toUpperCase();
  let index = 0;
  for (const letter of letters) index = index * 26 + letter.charCodeAt(0) - 64;
  return index - 1;
}

function parseAttributes(text) {
  const attrs = {};
  const pattern = /([\w:.-]+)="([^"]*)"/g;
  let match;
  while ((match = pattern.exec(text))) attrs[match[1]] = decodeXml(match[2]);
  return attrs;
}

function parseZip(buffer) {
  const files = new Map();
  let offset = 0;

  while (offset < buffer.length - 4) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const compression = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    const fileName = buffer.subarray(nameStart, nameStart + fileNameLength).toString("utf8");
    const data = buffer.subarray(dataStart, dataEnd);

    if (compression === 0) files.set(fileName, data);
    if (compression === 8) files.set(fileName, inflateRawSync(data));

    offset = dataEnd;
  }

  return files;
}

function getZipText(files, fileName) {
  const file = files.get(fileName);
  return file ? file.toString("utf8") : "";
}

function parseRelationships(xml) {
  const relationships = new Map();
  const pattern = /<Relationship\b([^>]*)\/?>/g;
  let match;

  while ((match = pattern.exec(xml))) {
    const attrs = parseAttributes(match[1]);
    if (attrs.Id && attrs.Target) relationships.set(attrs.Id, attrs.Target);
  }

  return relationships;
}

function parseSharedStrings(xml) {
  const strings = [];
  const itemPattern = /<si\b[\s\S]*?<\/si>/g;
  const textPattern = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
  let itemMatch;

  while ((itemMatch = itemPattern.exec(xml))) {
    const parts = [];
    let textMatch;
    while ((textMatch = textPattern.exec(itemMatch[0]))) parts.push(decodeXml(textMatch[1]));
    strings.push(parts.join(""));
  }

  return strings;
}

function parseCellValue(xml, type, sharedStrings) {
  if (type === "inlineStr") {
    const texts = [...xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1]));
    return texts.join("");
  }

  const value = xml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] || "";
  if (type === "s") return sharedStrings[Number(value)] || "";
  if (type === "b") return value === "1" ? "TRUE" : "FALSE";
  return decodeXml(value);
}

function parseSheetRows(xml, sharedStrings) {
  const rows = [];
  const rowPattern = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
  const cellPattern = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(xml))) {
    const rowNumber = Number(parseAttributes(rowMatch[1]).r || rows.length + 1);
    const values = [];
    let cellMatch;

    while ((cellMatch = cellPattern.exec(rowMatch[2]))) {
      const attrs = parseAttributes(cellMatch[1]);
      const columnIndex = columnToIndex(attrs.r || "");
      values[columnIndex] = normalizeText(parseCellValue(cellMatch[2], attrs.t, sharedStrings));
    }

    rows.push({ rowNumber, values });
  }

  return rows.filter((row) => row.values.some(Boolean));
}

function findWorkbookSheets(files) {
  const workbook = getZipText(files, "xl/workbook.xml");
  const rels = parseRelationships(getZipText(files, "xl/_rels/workbook.xml.rels"));
  const sheets = [];
  const sheetPattern = /<sheet\b([^>]*)\/?>/g;
  let match;

  while ((match = sheetPattern.exec(workbook))) {
    const attrs = parseAttributes(match[1]);
    const relId = attrs["r:id"];
    const target = rels.get(relId);
    if (!target) continue;
    const normalizedTarget = target.startsWith("/") ? target.slice(1) : path.posix.join("xl", target);
    sheets.push({ name: attrs.name || normalizedTarget, path: normalizedTarget.replace(/\\/g, "/") });
  }

  return sheets.length ? sheets : [{ name: "Sheet1", path: "xl/worksheets/sheet1.xml" }];
}

async function readWorkbook(filePath) {
  const files = parseZip(await readFile(filePath));
  const sharedStrings = parseSharedStrings(getZipText(files, "xl/sharedStrings.xml"));
  const sheets = findWorkbookSheets(files);

  return sheets.map((sheet) => ({
    ...sheet,
    rows: parseSheetRows(getZipText(files, sheet.path), sharedStrings)
  }));
}

function detectHeader(rows) {
  let best = null;

  rows.forEach((row) => {
    const mapping = {};
    row.values.forEach((value, columnIndex) => {
      const normalized = normalizeHeader(value);
      for (const [field, aliases] of Object.entries(requiredColumns)) {
        if (mapping[field] !== undefined) continue;
        if (aliases.some((alias) => normalizeHeader(alias) === normalized)) mapping[field] = columnIndex;
      }
    });

    const score = Object.keys(mapping).length;
    if (!best || score > best.score) best = { row, mapping, score };
  });

  const missing = Object.keys(requiredColumns).filter((field) => best?.mapping[field] === undefined);
  if (!best || missing.length) {
    throw new Error(`No se detectaron columnas obligatorias en el Excel de productos: ${missing.join(", ")}`);
  }

  return best;
}

function workbookRowsToRecords(sheets) {
  const records = [];
  const detections = [];

  sheets.forEach((sheet) => {
    const header = detectHeader(sheet.rows);
    detections.push({
      sheet: sheet.name,
      headerRow: header.row.rowNumber,
      detectedColumns: Object.keys(header.mapping)
    });

    sheet.rows
      .filter((row) => row.rowNumber > header.row.rowNumber)
      .forEach((row) => {
        const record = Object.fromEntries(
          Object.entries(header.mapping).map(([field, columnIndex]) => [field, normalizeText(row.values[columnIndex] || "")])
        );
        if (Object.values(record).some(Boolean)) records.push({ ...record, sheet: sheet.name, rowNumber: row.rowNumber });
      });
  });

  return { records, detections };
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
  if (!rows.length) return [];

  const [headers, ...dataRows] = rows;
  return dataRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [normalizeHeader(header), normalizeText(values[index] || "")]))
  );
}

function csvEscape(value = "") {
  const text = String(value ?? "");
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function renderCsv(rows) {
  return [
    imageMapColumns.join(","),
    ...rows.map((row) => imageMapColumns.map((column) => csvEscape(row[column])).join(","))
  ].join("\n");
}

function imageMapKey(row) {
  const skuKey = normalizeKeyPart(row.sku);
  if (skuKey) return `sku:${skuKey}`;
  return `product:${[row.modelo, row.marca, row.color].map(normalizeKeyPart).join("|")}`;
}

function isImageUrl(value = "") {
  return /^https?:\/\//i.test(value);
}

function imageSourceFor(url = "") {
  return /blob\.core\.windows\.net/i.test(url) ? "azure_blob" : "kordata";
}

function normalizeExistingImageRows(rows) {
  return rows.map((row) => ({
    modelo: row.modelo || "",
    marca: row.marca || "",
    color: row.color || "",
    sku: row.sku || "",
    image_source: row.image_source || "",
    image_url: row.image_url || "",
    local_path: row.local_path || "",
    gallery: row.gallery || "",
    image_status: row.image_status || "",
    notas: row.notas || ""
  }));
}

function toImageRows(records) {
  return records
    .filter((record) => isImageUrl(record.imagen))
    .map((record) => ({
      modelo: record.modelo,
      marca: "",
      color: "",
      sku: record.sku,
      image_source: imageSourceFor(record.imagen),
      image_url: record.imagen,
      local_path: "",
      gallery: "",
      image_status: "ASIGNADA",
      notas: `Importado desde Productos Excel Kordata. id=${record.id}; nombre=${record.nombreProducto}; hoja=${record.sheet}; fila=${record.rowNumber}.`
    }));
}

async function main() {
  const inputPath = getInputPath();
  if (!existsSync(inputPath)) {
    throw new Error(`No existe el Excel de productos Kordata: ${path.relative(rootDir, inputPath)}`);
  }

  const sheets = await readWorkbook(inputPath);
  const { records, detections } = workbookRowsToRecords(sheets);
  const importedRows = toImageRows(records);
  const existingText = await readFile(imageMapPath, "utf8").catch(() => `${imageMapColumns.join(",")}\n`);
  const existingRows = normalizeExistingImageRows(parseCsv(existingText));
  const rowIndex = new Map(existingRows.map((row) => [imageMapKey(row), row]));

  importedRows.forEach((row) => {
    rowIndex.set(imageMapKey(row), { ...rowIndex.get(imageMapKey(row)), ...row });
  });

  const mergedRows = [...rowIndex.values()].sort((left, right) =>
    [left.modelo, left.sku].join("|").localeCompare([right.modelo, right.sku].join("|"), "es", { numeric: true })
  );

  await mkdir(path.dirname(imageMapPath), { recursive: true });
  await writeFile(imageMapPath, `${renderCsv(mergedRows)}\n`, "utf8");

  console.log(`Excel Kordata imagenes: ${path.relative(rootDir, inputPath)}`);
  console.log(`Filas leidas: ${records.length}`);
  console.log(`Filas con imagen: ${importedRows.length}`);
  console.log(`image-map.csv actualizado: ${mergedRows.length} filas totales.`);
  console.log(`Columnas detectadas: ${detections.map((detection) => `${detection.sheet} fila ${detection.headerRow}`).join("; ")}`);
  console.log("data/products.json no fue modificado.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
