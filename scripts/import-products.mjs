import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const inputPath = path.join(rootDir, "data", "import", "products.master.csv");
const draftOutputPath = path.join(rootDir, "data", "import", "products.generated.json");
const publicOutputPath = path.join(rootDir, "data", "products.json");
const reportsDir = path.join(rootDir, "reports");
const reportJsonPath = path.join(reportsDir, "import-report.json");
const reportMdPath = path.join(reportsDir, "import-report.md");
const placeholderImage = "assets/products/tenis-deportivo-hombre.svg";

const validateOnly = process.argv.includes("--validate-only");
const publishMode = process.argv.includes("--publish");
const mode = validateOnly ? "validate" : publishMode ? "publish" : "draft";

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
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

  const [headers, ...dataRows] = rows;
  return dataRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), (values[index] || "").trim()]))
  );
}

function splitList(value) {
  if (!value || value.toLowerCase() === "pendiente") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBoolean(value) {
  const normalized = value.trim().toLowerCase();
  return ["si", "sí", "true", "1", "yes"].includes(normalized);
}

function normalizePrice(value) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (/^consultar$/i.test(clean)) return "Consultar";
  if (/^c\$\s*/i.test(clean)) return clean.replace(/^c\$\s*/i, "C$ ");
  if (/^\d/.test(clean)) return `C$ ${clean}`;
  return clean.replace(/^2\s*x\s*c\$/i, "2 x C$");
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isPending(value) {
  return !value || value.trim().toLowerCase() === "pendiente";
}

function csvRowToProduct(row, index) {
  const sku = row.sku || row.codigo_interno;
  const colors = splitList(row.colores);
  const gallery = splitList(row.galeria);
  const hasImage = Boolean(row.imagen_principal);
  const image = hasImage ? row.imagen_principal : placeholderImage;
  const description = row.descripcion_larga || row.descripcion_corta;

  return {
    id: slugify(sku || `producto-${index + 1}`),
    sku,
    nombre: row.nombre || sku || `Producto ${index + 1}`,
    marca: row.marca || "Pendiente",
    categoría: row.categoria || "Pendiente",
    género: row.genero || "Pendiente",
    color: row.color_principal || "Pendiente",
    colores: colors.length ? colors : row.color_principal && !isPending(row.color_principal) ? [row.color_principal] : [],
    tallas: splitList(row.tallas),
    precio: normalizePrice(row.precio_normal) || "Consultar",
    precio_mayorista: normalizePrice(row.precio_mayorista) || "Consultar",
    estado: row.estado || "Pendiente",
    nuevo: normalizeBoolean(row.nuevo),
    destacado: normalizeBoolean(row.destacado),
    imagen: image,
    galería: gallery.length ? gallery : [image],
    descripción: description || ""
  };
}

function addIssue(report, type, severity, rowNumber, sku, message) {
  report.issues.push({ type, severity, row: rowNumber, sku: sku || "", message });
}

function validateRows(rows, products) {
  const report = {
    generatedAt: new Date().toISOString(),
    source: "data/import/products.master.csv",
    draftOutput: validateOnly ? null : "data/import/products.generated.json",
    publishOutput: publishMode ? "data/products.json" : null,
    mode,
    inventoryStatus: "migration_draft",
    note: "Las referencias extraídas desde Canva son borrador de migración y no inventario público final.",
    publishBlocked: false,
    summary: {
      rows: rows.length,
      products: products.length,
      errors: 0,
      criticalWarnings: 0,
      warnings: 0
    },
    issues: []
  };

  const skuCount = new Map();
  rows.forEach((row) => {
    if (row.sku) skuCount.set(row.sku, (skuCount.get(row.sku) || 0) + 1);
  });

  rows.forEach((row, index) => {
    const product = products[index];
    const rowNumber = index + 2;

    if (!row.sku) addIssue(report, "missing_sku", "error", rowNumber, row.sku, "Producto sin SKU.");
    if (row.sku && skuCount.get(row.sku) > 1) addIssue(report, "duplicate_sku", "error", rowNumber, row.sku, "SKU duplicado.");
    if (isPending(row.categoria)) addIssue(report, "missing_category", "critical_warning", rowNumber, row.sku, "Producto sin categoría confirmada.");
    if (isPending(row.marca)) addIssue(report, "missing_brand", "critical_warning", rowNumber, row.sku, "Producto sin marca confirmada.");
    if (isPending(row.color_principal)) addIssue(report, "missing_color", "critical_warning", rowNumber, row.sku, "Producto sin color principal confirmado.");
    if (!row.tallas) addIssue(report, "missing_sizes", "warning", rowNumber, row.sku, "Producto sin tallas.");
    if (!row.precio_normal) addIssue(report, "missing_price", "warning", rowNumber, row.sku, "Producto sin precio normal.");
    if (!row.imagen_principal) addIssue(report, "missing_image", "critical_warning", rowNumber, row.sku, "Producto sin imagen principal real; se usó placeholder técnico solo para borrador.");
    if (row.imagen_principal && !existsSync(path.join(rootDir, row.imagen_principal))) {
      addIssue(report, "missing_referenced_image", "critical_warning", rowNumber, row.sku, `No existe la imagen referenciada: ${row.imagen_principal}`);
    }
    splitList(row.galeria).forEach((image) => {
      if (!existsSync(path.join(rootDir, image))) {
        addIssue(report, "missing_referenced_image", "critical_warning", rowNumber, row.sku, `No existe la imagen de galería: ${image}`);
      }
    });
    if (isPending(row.estado)) addIssue(report, "missing_status", "warning", rowNumber, row.sku, "Producto con estado vacío o pendiente.");
    if (!product.descripción) addIssue(report, "missing_description", "warning", rowNumber, row.sku, "Producto con descripción vacía.");
  });

  report.summary.errors = report.issues.filter((issue) => issue.severity === "error").length;
  report.summary.criticalWarnings = report.issues.filter((issue) => issue.severity === "critical_warning").length;
  report.summary.warnings = report.issues.filter((issue) => issue.severity === "warning").length;
  report.publishBlocked = publishMode && (report.summary.errors > 0 || report.summary.criticalWarnings > 0);
  return report;
}

function renderMarkdownReport(report) {
  const rows = [
    "# Reporte de importación de productos",
    "",
    `- Fuente: \`${report.source}\``,
    `- Borrador generado: ${report.draftOutput ? `\`${report.draftOutput}\`` : "no"}`,
    `- Salida pública solicitada: ${report.publishOutput ? `\`${report.publishOutput}\`` : "no"}`,
    `- Modo: ${report.mode}`,
    `- Estado comercial: borrador de migración`,
    `- Publicación bloqueada: ${report.publishBlocked ? "sí" : "no"}`,
    `- Filas leídas: ${report.summary.rows}`,
    `- Productos generados: ${report.summary.products}`,
    `- Errores: ${report.summary.errors}`,
    `- Advertencias críticas: ${report.summary.criticalWarnings}`,
    `- Advertencias menores: ${report.summary.warnings}`,
    "",
    "> Las 10 referencias extraídas desde Canva son borrador de migración, no inventario público final.",
    "",
    "## Hallazgos",
    ""
  ];

  if (!report.issues.length) {
    rows.push("No se encontraron errores ni advertencias.");
  } else {
    rows.push("| Severidad | Tipo | Fila | SKU | Mensaje |");
    rows.push("| --- | --- | ---: | --- | --- |");
    report.issues.forEach((issue) => {
      rows.push(`| ${issue.severity} | ${issue.type} | ${issue.row} | ${issue.sku} | ${issue.message} |`);
    });
  }

  rows.push("", "## Siguiente paso", "");
  if (report.publishBlocked) {
    rows.push("Completar categoría, marca, color e imágenes reales antes de publicar en `data/products.json`.");
  } else {
    rows.push("Revisar el borrador generado, cargar imágenes reales si aplica y publicar solo cuando el catálogo esté listo.");
  }

  return `${rows.join("\n")}\n`;
}

async function main() {
  const csv = await readFile(inputPath, "utf8");
  const rows = parseCsv(csv);
  const products = rows.map(csvRowToProduct);
  const report = validateRows(rows, products);

  await mkdir(reportsDir, { recursive: true });
  await writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(reportMdPath, renderMarkdownReport(report), "utf8");

  if (!validateOnly) {
    await writeFile(draftOutputPath, `${JSON.stringify(products, null, 2)}\n`, "utf8");
  }

  if (publishMode && !report.publishBlocked) {
    await writeFile(publicOutputPath, `${JSON.stringify(products, null, 2)}\n`, "utf8");
  }

  const action = validateOnly ? "Validación completada" : publishMode ? "Publicación evaluada" : "Borrador generado";
  console.log(`${action}: ${products.length} productos, ${report.summary.errors} errores, ${report.summary.criticalWarnings} advertencias críticas, ${report.summary.warnings} advertencias menores.`);

  if (report.publishBlocked) {
    console.log("Publicación bloqueada: data/products.json no fue modificado.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
