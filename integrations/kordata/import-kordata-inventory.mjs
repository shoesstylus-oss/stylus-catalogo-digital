import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

const defaultInputDir = path.join(rootDir, "catalog-data", "kordata");
const exportPath = path.join(rootDir, "catalog-data", "exports", "kordata-products.generated.json");
const reportsDir = path.join(rootDir, "catalog-data", "reports");
const lowStockThreshold = Number(readOption("--low-stock", "3"));

const columnMap = {
  sku: ["sku", "codigo", "codigo sku", "codigo producto", "codigoproducto", "referencia"],
  nombreDelProducto: ["nombredelproducto", "nombre del producto", "producto", "descripcion", "descripcion producto", "nombre"],
  modelo: ["modelo", "model"],
  talla: ["talla", "size", "numero", "numeracion"],
  color: ["color", "colour"],
  categoria: ["categoria", "category", "linea", "familia"],
  marca: ["marca", "brand"],
  precioDeVenta: ["preciodeventa", "precio de venta", "precio venta", "venta", "precio", "pv"],
  costo: ["costo", "cost", "precio costo", "costounitario", "costo unitario"],
  reservado: ["reservado", "reserva", "reservas"],
  disponible: ["disponible", "available", "stock disponible"],
  existencia: ["existencia", "stock", "inventario", "cantidad"],
  ubicacion: ["ubicacion", "sucursal", "bodega", "tienda", "almacen"]
};

const requiredColumns = ["sku", "modelo", "talla", "color", "categoria", "marca", "precioDeVenta", "costo", "disponible", "existencia", "ubicacion"];
const groupingColumns = ["modelo", "marca", "color", "categoria"];

function readOption(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

function getInputArg() {
  const explicit = readOption("--input");
  if (explicit) return path.resolve(rootDir, explicit);
  return process.argv.find((arg, index) => index > 1 && !arg.startsWith("--")) || "";
}

function normalizeHeader(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeKey(value = "") {
  return normalizeHeader(value).replace(/[^a-z0-9]+/g, "");
}

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
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

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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

function parseAttributes(text) {
  const attrs = {};
  const pattern = /([\w:.-]+)="([^"]*)"/g;
  let match;
  while ((match = pattern.exec(text))) attrs[match[1]] = decodeXml(match[2]);
  return attrs;
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
      values[columnIndex] = parseCellValue(cellMatch[2], attrs.t, sharedStrings);
    }

    rows.push({ rowNumber, values: values.map((value) => normalizeText(value)) });
  }

  return rows.filter((row) => row.values.some(Boolean));
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

  rows.forEach((row, rowIndex) => {
    const mapping = {};
    const used = new Set();

    row.values.forEach((value, columnIndex) => {
      const normalized = normalizeHeader(value);
      const compact = normalizeKey(value);
      for (const [field, aliases] of Object.entries(columnMap)) {
        if (used.has(field)) continue;
        const matched = aliases.some((alias) => normalizeHeader(alias) === normalized || normalizeKey(alias) === compact);
        if (matched) {
          mapping[field] = columnIndex;
          used.add(field);
          break;
        }
      }
    });

    const score = Object.keys(mapping).length;
    const hasGrouping = groupingColumns.every((field) => field in mapping);
    if (!best || score > best.score || (score === best.score && hasGrouping)) {
      best = { row, rowIndex, rowNumber: row.rowNumber, mapping, score };
    }
  });

  if (!best || best.score < 5) {
    throw new Error("No se pudo detectar la fila real de encabezados de Kordata.");
  }

  return best;
}

function rowToRecord(row, mapping, sourceFile, sheetName) {
  const record = { sourceFile, sheetName, sourceRow: row.rowNumber, rawValues: {} };
  for (const field of Object.keys(columnMap)) {
    record.rawValues[field] = normalizeText(row.values[mapping[field]] || "");
    record[field] = record.rawValues[field];
  }
  record.precioDeVenta = parseNumber(record.precioDeVenta);
  record.costo = parseNumber(record.costo);
  record.reservado = parseNumber(record.reservado);
  record.disponible = parseNumber(record.disponible);
  record.existencia = parseNumber(record.existencia);
  return record;
}

function groupRecords(records) {
  const groups = new Map();
  const issues = [];

  records.forEach((record) => {
    const keyParts = groupingColumns.map((field) => record[field] || "SIN_DATO");
    const key = keyParts.map((part) => normalizeKey(part) || "sin-dato").join("|");
    const group = groups.get(key) || createGroup(record, key);

    addInventory(group, record);
    collectRecordIssues(record, issues);
    groups.set(key, group);
  });

  const products = [...groups.values()].map(finalizeGroup).sort((a, b) => a.modelo.localeCompare(b.modelo));
  return { products, issues };
}

function createGroup(record, key) {
  return {
    id: key.replace(/\|/g, "-"),
    modelo: record.modelo || "",
    marca: record.marca || "",
    color: record.color || "",
    categoria: record.categoria || "",
    nombre: record.nombreDelProducto || "",
    skus: new Set(),
    tallasDisponibles: new Set(),
    existenciaPorTalla: new Map(),
    existenciaPorSucursal: new Map(),
    precios: new Set(),
    costos: new Set(),
    rows: []
  };
}

function addInventory(group, record) {
  const talla = record.talla || "SIN_TALLA";
  const ubicacion = record.ubicacion || "SIN_UBICACION";
  const disponible = record.disponible || Math.max(record.existencia - record.reservado, 0);
  const existencia = record.existencia || disponible + record.reservado;

  if (record.sku) group.skus.add(record.sku);
  if (record.precioDeVenta > 0) group.precios.add(record.precioDeVenta);
  if (record.costo > 0) group.costos.add(record.costo);
  if (disponible > 0) group.tallasDisponibles.add(talla);

  const bySize = group.existenciaPorTalla.get(talla) || { talla, existencia: 0, disponible: 0, reservado: 0 };
  bySize.existencia += existencia;
  bySize.disponible += disponible;
  bySize.reservado += record.reservado;
  group.existenciaPorTalla.set(talla, bySize);

  const byBranch = group.existenciaPorSucursal.get(ubicacion) || { ubicacion, existencia: 0, disponible: 0, reservado: 0 };
  byBranch.existencia += existencia;
  byBranch.disponible += disponible;
  byBranch.reservado += record.reservado;
  group.existenciaPorSucursal.set(ubicacion, byBranch);

  group.rows.push(record);
}

function collectRecordIssues(record, issues) {
  for (const field of requiredColumns) {
    if (field in record && record.rawValues[field] !== "") continue;
    issues.push({
      severity: groupingColumns.includes(field) ? "critical_warning" : "warning",
      type: `missing_${field}`,
      sourceFile: record.sourceFile,
      sheetName: record.sheetName,
      row: record.sourceRow,
      sku: record.sku,
      message: `Campo requerido sin dato: ${field}.`
    });
  }
}

function chooseSingleValue(values) {
  return [...values].sort((a, b) => b - a)[0] || 0;
}

function finalizeGroup(group) {
  const precioDeVenta = chooseSingleValue(group.precios);
  const costo = chooseSingleValue(group.costos);
  const margenCordobas = roundMoney(precioDeVenta - costo);
  const margenPorcentual = precioDeVenta > 0 ? roundMoney((margenCordobas / precioDeVenta) * 100) : 0;
  const existenciaPorTalla = [...group.existenciaPorTalla.values()].sort((a, b) => String(a.talla).localeCompare(String(b.talla), "es", { numeric: true }));
  const existenciaPorSucursal = [...group.existenciaPorSucursal.values()].sort((a, b) => a.ubicacion.localeCompare(b.ubicacion));
  const existenciaTotal = existenciaPorTalla.reduce((total, item) => total + item.existencia, 0);
  const disponibleTotal = existenciaPorTalla.reduce((total, item) => total + item.disponible, 0);
  const reservadoTotal = existenciaPorTalla.reduce((total, item) => total + item.reservado, 0);

  return {
    id: group.id,
    modelo: group.modelo,
    marca: group.marca,
    color: group.color,
    categoria: group.categoria,
    nombre: group.nombre,
    skus: [...group.skus].sort(),
    tallasDisponibles: [...group.tallasDisponibles].sort((a, b) => String(a).localeCompare(String(b), "es", { numeric: true })),
    existenciaPorTalla,
    existenciaTotal,
    disponibleTotal,
    reservadoTotal,
    existenciaPorSucursal,
    precioDeVenta,
    costo,
    margenCordobas,
    margenPorcentual,
    sourceRows: group.rows.map((record) => ({
      file: record.sourceFile,
      sheet: record.sheetName,
      row: record.sourceRow,
      sku: record.sku,
      talla: record.talla,
      ubicacion: record.ubicacion
    }))
  };
}

async function resolveInputFiles() {
  const inputArg = getInputArg();
  const target = inputArg ? path.resolve(rootDir, inputArg) : defaultInputDir;

  if (!existsSync(target)) {
    throw new Error(`No existe la ruta de entrada: ${path.relative(rootDir, target)}`);
  }

  const targetStat = await stat(target);
  if (targetStat.isFile()) return [target];

  const names = await readdir(target);
  return names
    .filter((name) => /\.xlsx$/i.test(name) && !name.startsWith("~$"))
    .map((name) => path.join(target, name))
    .sort();
}

async function importFiles(files) {
  const records = [];
  const headerDetections = [];

  for (const file of files) {
    const workbook = await readWorkbook(file);
    for (const sheet of workbook) {
      if (!sheet.rows.length) continue;
      const header = detectHeader(sheet.rows);
      const dataRows = sheet.rows.slice(header.rowIndex + 1);
      headerDetections.push({
        file: path.relative(rootDir, file),
        sheet: sheet.name,
        headerRow: header.rowNumber,
        detectedColumns: Object.keys(header.mapping)
      });
      records.push(
        ...dataRows
          .filter((row) => row.values.some(Boolean))
          .map((row) => rowToRecord(row, header.mapping, path.relative(rootDir, file), sheet.name))
          .filter((record) => Object.values(record).some((value) => value !== ""))
      );
    }
  }

  return { records, headerDetections };
}

function buildSummary(products, records, headerDetections, issues) {
  const lowStock = products.filter((product) => product.disponibleTotal > 0 && product.disponibleTotal <= lowStockThreshold);
  return {
    generatedAt: new Date().toISOString(),
    source: "Exportacion Excel de inventario Kordata",
    output: "catalog-data/exports/kordata-products.generated.json",
    publishOutput: null,
    publicCatalogTouched: false,
    rowsRead: records.length,
    productsGrouped: products.length,
    headerDetections,
    totals: {
      existenciaTotal: products.reduce((total, product) => total + product.existenciaTotal, 0),
      disponibleTotal: products.reduce((total, product) => total + product.disponibleTotal, 0),
      reservadoTotal: products.reduce((total, product) => total + product.reservadoTotal, 0),
      lowStockProducts: lowStock.length,
      missingDataIssues: issues.length
    },
    lowStock
  };
}

function renderSummary(summary) {
  return [
    "# Resumen importacion Kordata STYLUS",
    "",
    `- Generado: ${summary.generatedAt}`,
    `- Filas leidas: ${summary.rowsRead}`,
    `- Productos agrupados: ${summary.productsGrouped}`,
    `- Existencia total: ${summary.totals.existenciaTotal}`,
    `- Disponible total: ${summary.totals.disponibleTotal}`,
    `- Reservado total: ${summary.totals.reservadoTotal}`,
    `- Productos con stock bajo: ${summary.totals.lowStockProducts}`,
    `- Hallazgos de datos faltantes: ${summary.totals.missingDataIssues}`,
    "- Catalogo publico: `data/products.json` no fue modificado.",
    "",
    "## Encabezados detectados",
    "",
    table(
      ["Archivo", "Hoja", "Fila", "Columnas"],
      summary.headerDetections.map((item) => [item.file, item.sheet, item.headerRow, item.detectedColumns.join(", ")])
    )
  ].join("\n");
}

function renderStockByBranch(products) {
  const rows = [];
  for (const product of products) {
    for (const branch of product.existenciaPorSucursal) {
      rows.push([product.modelo, product.marca, product.color, product.categoria, branch.ubicacion, branch.existencia, branch.disponible, branch.reservado]);
    }
  }

  return ["# Existencia por sucursal Kordata", "", table(["Modelo", "Marca", "Color", "Categoria", "Sucursal", "Existencia", "Disponible", "Reservado"], rows)].join("\n");
}

function renderMissingData(issues) {
  return [
    "# Datos faltantes Kordata",
    "",
    issues.length
      ? table(["Severidad", "Tipo", "Archivo", "Hoja", "Fila", "SKU", "Mensaje"], issues.map((issue) => [issue.severity, issue.type, issue.sourceFile, issue.sheetName, issue.row, issue.sku, issue.message]))
      : "No se encontraron datos faltantes."
  ].join("\n");
}

function renderLowStock(summary) {
  return [
    "# Stock bajo Kordata",
    "",
    `Umbral usado: disponible total menor o igual a ${lowStockThreshold}.`,
    "",
    summary.lowStock.length
      ? table(["Modelo", "Marca", "Color", "Categoria", "Disponible", "Existencia"], summary.lowStock.map((product) => [product.modelo, product.marca, product.color, product.categoria, product.disponibleTotal, product.existenciaTotal]))
      : "No se encontraron productos con stock bajo."
  ].join("\n");
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

async function writeOutputs(products, summary, issues) {
  await mkdir(path.dirname(exportPath), { recursive: true });
  await mkdir(reportsDir, { recursive: true });
  await writeFile(exportPath, `${JSON.stringify({ ...summary, products }, null, 2)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "kordata-summary.md"), `${renderSummary(summary)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "kordata-stock-by-branch.md"), `${renderStockByBranch(products)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "kordata-missing-data.md"), `${renderMissingData(issues)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "kordata-low-stock.md"), `${renderLowStock(summary)}\n`, "utf8");
}

async function main() {
  const files = await resolveInputFiles();
  if (!files.length) throw new Error("No se encontraron archivos .xlsx de Kordata en catalog-data/kordata.");

  const { records, headerDetections } = await importFiles(files);
  const { products, issues } = groupRecords(records);
  const summary = buildSummary(products, records, headerDetections, issues);

  await writeOutputs(products, summary, issues);
  console.log(`Kordata importado: ${records.length} filas, ${products.length} productos agrupados, ${issues.length} hallazgos.`);
  console.log("data/products.json no fue modificado.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
