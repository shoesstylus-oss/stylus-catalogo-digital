import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const catalogDataDir = path.join(rootDir, "catalog-data");
const inputPath = path.join(catalogDataDir, "csv", "products.master.csv");
const draftOutputPath = path.join(catalogDataDir, "exports", "products.generated.json");
const publicOutputPath = path.join(rootDir, "data", "products.json");
const reportsDir = path.join(catalogDataDir, "reports");
const dashboardPath = path.join(rootDir, "docs", "migration-dashboard.md");
const placeholderImage = "assets/products/tenis-deportivo-hombre.svg";

const validateOnly = process.argv.includes("--validate-only");
const publishMode = process.argv.includes("--publish");
const mode = validateOnly ? "validate" : publishMode ? "publish" : "draft";

const migrationStatuses = new Set(["PENDIENTE", "EN_REVISION", "COMPLETO", "PUBLICADO"]);
const imageStatuses = new Set(["NO_CARGADA", "PENDIENTE", "OPTIMIZADA", "PUBLICADA"]);

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
  if (!value || isPending(value)) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBoolean(value = "") {
  const normalized = value.trim().toLowerCase();
  return ["si", "sí", "true", "1", "yes"].includes(normalized);
}

function normalizePrice(value = "") {
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

function isPending(value = "") {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized === "pendiente" || normalized === "no_cargada";
}

function hasRealValue(value = "") {
  return !isPending(value);
}

function calculateQualityScore(row) {
  const checks = [
    hasRealValue(row.marca),
    hasRealValue(row.modelo),
    hasRealValue(row.categoria),
    hasRealValue(row.descripcion_larga || row.descripcion_corta),
    hasRealValue(row.precio_normal),
    hasRealValue(row.imagen_principal),
    hasRealValue(row.color_principal),
    splitList(row.tallas).length > 0
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function enrichRow(row) {
  const migrationStatus = (row.migration_status || "PENDIENTE").toUpperCase();
  const imageStatus = (row.image_status || "NO_CARGADA").toUpperCase();
  return {
    ...row,
    migration_status: migrationStatus,
    image_status: imageStatus,
    quality_score: String(calculateQualityScore(row))
  };
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
    descripción: description || "",
    migration_status: row.migration_status,
    image_status: row.image_status,
    quality_score: Number(row.quality_score),
    lote: {
      id: row.batch_id || "LOTE-01",
      nombre: row.batch_name || "Lote 01",
      paginas: row.page_range || "Páginas 1-5"
    }
  };
}

function addIssue(report, type, severity, rowNumber, sku, message) {
  report.issues.push({ type, severity, row: rowNumber, sku: sku || "", message });
}

function getBatchSummary(rows) {
  const batches = new Map();

  rows.forEach((row) => {
    const id = row.batch_id || "LOTE-01";
    const current = batches.get(id) || {
      id,
      name: row.batch_name || id,
      pages: row.page_range || "",
      total: 0,
      reviewed: 0,
      published: 0,
      pending: 0
    };

    current.total += 1;
    if (["EN_REVISION", "COMPLETO", "PUBLICADO"].includes(row.migration_status)) current.reviewed += 1;
    if (row.migration_status === "PUBLICADO") current.published += 1;
    if (row.migration_status === "PENDIENTE") current.pending += 1;
    batches.set(id, current);
  });

  return [...batches.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function validateRows(rows, products) {
  const batches = getBatchSummary(rows);
  const completeProducts = rows.filter((row) => row.migration_status === "COMPLETO").length;
  const publishedProducts = rows.filter((row) => row.migration_status === "PUBLICADO").length;
  const pendingProducts = rows.filter((row) => row.migration_status === "PENDIENTE").length;
  const reviewedProducts = rows.filter((row) => ["EN_REVISION", "COMPLETO", "PUBLICADO"].includes(row.migration_status)).length;
  const imagePending = rows.filter((row) => ["NO_CARGADA", "PENDIENTE"].includes(row.image_status)).length;

  const report = {
    generatedAt: new Date().toISOString(),
    source: "catalog-data/csv/products.master.csv",
    draftOutput: validateOnly ? null : "catalog-data/exports/products.generated.json",
    publishOutput: null,
    mode,
    inventoryStatus: "migration_draft",
    note: "Las referencias extraídas desde Canva son borrador de migración, no inventario público final.",
    publishBlocked: publishMode,
    summary: {
      rows: rows.length,
      products: products.length,
      completeProducts,
      pendingProducts,
      publishedProducts,
      reviewedProducts,
      imagePending,
      progressPercent: rows.length ? Math.round((publishedProducts / rows.length) * 100) : 0,
      errors: 0,
      criticalWarnings: 0,
      warnings: 0
    },
    batches,
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
    if (!migrationStatuses.has(row.migration_status)) {
      addIssue(report, "invalid_migration_status", "error", rowNumber, row.sku, `Estado de migración no permitido: ${row.migration_status}.`);
    }
    if (!imageStatuses.has(row.image_status)) {
      addIssue(report, "invalid_image_status", "error", rowNumber, row.sku, `Estado de imagen no permitido: ${row.image_status}.`);
    }
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
    if (Number(row.quality_score) < 100) {
      addIssue(report, "quality_incomplete", "warning", rowNumber, row.sku, `Calidad comercial ${row.quality_score}/100.`);
    }
  });

  report.summary.errors = report.issues.filter((issue) => issue.severity === "error").length;
  report.summary.criticalWarnings = report.issues.filter((issue) => issue.severity === "critical_warning").length;
  report.summary.warnings = report.issues.filter((issue) => issue.severity === "warning").length;
  return report;
}

function renderIssueTable(issues) {
  if (!issues.length) return "No se encontraron hallazgos.\n";

  return [
    "| Severidad | Tipo | Fila | SKU | Mensaje |",
    "| --- | --- | ---: | --- | --- |",
    ...issues.map((issue) => `| ${issue.severity} | ${issue.type} | ${issue.row} | ${issue.sku} | ${issue.message} |`),
    ""
  ].join("\n");
}

function renderMigrationSummary(report) {
  return [
    "# Resumen de migración comercial STYLUS",
    "",
    `- Fuente: \`${report.source}\``,
    `- Exportación borrador: ${report.draftOutput ? `\`${report.draftOutput}\`` : "no generada en modo validación"}`,
    "- Catálogo público: `data/products.json` no se modifica en esta etapa.",
    `- Modo: ${report.mode}`,
    "- Estado comercial: borrador de migración por lotes.",
    "",
    "> Las 10 referencias extraídas desde Canva son borrador de migración, no inventario público final.",
    "",
    "## Totales",
    "",
    `- Productos leídos: ${report.summary.products}`,
    `- Productos completos: ${report.summary.completeProducts}`,
    `- Productos pendientes: ${report.summary.pendingProducts}`,
    `- Productos publicados: ${report.summary.publishedProducts}`,
    `- Imágenes pendientes: ${report.summary.imagePending}`,
    `- Errores: ${report.summary.errors}`,
    `- Advertencias críticas: ${report.summary.criticalWarnings}`,
    `- Advertencias menores: ${report.summary.warnings}`,
    "",
    "## Lotes",
    "",
    "| Lote | Páginas | Productos | Revisados | Publicados | Pendientes |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
    ...report.batches.map(
      (batch) => `| ${batch.name} | ${batch.pages || "Pendiente"} | ${batch.total} | ${batch.reviewed} | ${batch.published} | ${batch.pending} |`
    ),
    "",
    "## Hallazgos",
    "",
    renderIssueTable(report.issues)
  ].join("\n");
}

function renderMissingData(report) {
  const missingIssues = report.issues.filter((issue) => issue.type.startsWith("missing_") || issue.type === "quality_incomplete");
  return [
    "# Datos faltantes para digitalización",
    "",
    "Este reporte identifica campos que deben completarse antes de considerar publicable una referencia del Catálogo Maestro Canva STYLUS 2026.",
    "",
    renderIssueTable(missingIssues)
  ].join("\n");
}

function renderDuplicateSkus(report) {
  const duplicates = report.issues.filter((issue) => issue.type === "duplicate_sku");
  return [
    "# SKU duplicados",
    "",
    duplicates.length ? renderIssueTable(duplicates) : "No se encontraron SKU duplicados.\n"
  ].join("\n");
}

function renderMigrationProgress(report) {
  return [
    "# Avance de migración",
    "",
    `- Total productos: ${report.summary.products}`,
    `- Productos completos: ${report.summary.completeProducts}`,
    `- Productos pendientes: ${report.summary.pendingProducts}`,
    `- Productos publicados: ${report.summary.publishedProducts}`,
    `- Porcentaje de avance: ${report.summary.progressPercent}%`,
    "",
    "El avance se calcula sobre productos publicados dentro del flujo de digitalización. En esta etapa el catálogo público vigente permanece en `data/products.json`."
  ].join("\n");
}

function renderDashboard(report) {
  const lastBatch = report.batches.at(-1);
  const status =
    report.summary.errors > 0
      ? "Con errores por resolver"
      : report.summary.criticalWarnings > 0
        ? "Pendiente por advertencias críticas"
        : "Preparado para revisión comercial";

  return [
    "# Tablero de migración STYLUS",
    "",
    "## Estado general",
    "",
    `- Estado: ${status}`,
    `- Último lote procesado: ${lastBatch ? `${lastBatch.name} (${lastBatch.pages || "páginas pendientes"})` : "Sin lotes procesados"}`,
    `- Productos revisados: ${report.summary.reviewedProducts}`,
    `- Productos publicados: ${report.summary.publishedProducts}`,
    `- Productos pendientes: ${report.summary.pendingProducts}`,
    `- Imágenes pendientes: ${report.summary.imagePending}`,
    `- Errores encontrados: ${report.summary.errors}`,
    `- Advertencias críticas: ${report.summary.criticalWarnings}`,
    "",
    "## Nota operativa",
    "",
    "La digitalización trabaja por lotes desde `catalog-data/csv/products.master.csv`. Los borradores se exportan a `catalog-data/exports/products.generated.json` y no reemplazan `data/products.json`."
  ].join("\n");
}

async function main() {
  const csv = await readFile(inputPath, "utf8");
  const rows = parseCsv(csv).map(enrichRow);
  const products = rows.map(csvRowToProduct);
  const report = validateRows(rows, products);

  await mkdir(path.dirname(draftOutputPath), { recursive: true });
  await mkdir(reportsDir, { recursive: true });
  await mkdir(path.dirname(dashboardPath), { recursive: true });

  await writeFile(path.join(reportsDir, "migration-summary.md"), `${renderMigrationSummary(report)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "missing-data.md"), `${renderMissingData(report)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "duplicate-skus.md"), `${renderDuplicateSkus(report)}\n`, "utf8");
  await writeFile(path.join(reportsDir, "migration-progress.md"), `${renderMigrationProgress(report)}\n`, "utf8");
  await writeFile(dashboardPath, `${renderDashboard(report)}\n`, "utf8");

  if (!validateOnly) {
    await writeFile(draftOutputPath, `${JSON.stringify(products, null, 2)}\n`, "utf8");
  }

  if (publishMode) {
    console.log("Publicación deshabilitada en Etapa 1: data/products.json no fue modificado.");
    process.exitCode = 1;
  }

  const action = validateOnly ? "Validación completada" : publishMode ? "Publicación bloqueada" : "Borrador generado";
  console.log(`${action}: ${products.length} productos, ${report.summary.errors} errores, ${report.summary.criticalWarnings} advertencias críticas, ${report.summary.warnings} advertencias menores.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
