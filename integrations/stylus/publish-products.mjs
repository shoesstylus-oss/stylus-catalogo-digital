import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

const enrichedInputPath = path.join(rootDir, "catalog-data", "exports", "stylus-products.enriched.json");
const previewOutputPath = path.join(rootDir, "catalog-data", "exports", "products.preview.json");
const publicOutputPath = path.join(rootDir, "data", "products.json");
const backupOutputPath = path.join(rootDir, "data", "products.backup.json");
const reportsDir = path.join(rootDir, "catalog-data", "reports");
const previewReportPath = path.join(reportsDir, "publish-preview.md");
const resultReportPath = path.join(reportsDir, "publish-result.md");

const publishMode = process.argv.includes("--publish");
const previewMode = process.argv.includes("--preview") || !publishMode;
const categoryKey = "categor\u00eda";
const genderKey = "g\u00e9nero";
const galleryKey = "galer\u00eda";
const descriptionKey = "descripci\u00f3n";

function getEnrichedProducts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.products)) return payload.products;
  return [];
}

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizePrice(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return `C$ ${value}`;
  const text = normalizeText(value);
  if (!text) return "";
  return /^\d+(\.\d+)?$/.test(text) ? `C$ ${text}` : text;
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  return normalizeText(value) !== "";
}

function validatePublishableProduct(product) {
  const missing = [];
  if (product.publicable !== true) missing.push("publicable");
  if (!hasValue(product.imagen_principal)) missing.push("imagen_principal");
  if (!hasValue(product.slug)) missing.push("slug");
  if (!hasValue(product.precio)) missing.push("precio");
  if (!hasValue(product.tallasDisponibles)) missing.push("tallasDisponibles");
  if (!hasValue(product.nombre_comercial)) missing.push("nombre_comercial");
  if (!hasValue(product.categoria_comercial)) missing.push("categoria_comercial");
  if (!(Number(product.disponibleTotal) > 0)) missing.push("disponibleTotal");
  return missing;
}

function toPublicProduct(product) {
  const gallery = product.galeria?.length ? product.galeria : [product.imagen_principal];
  const sku = product.sku || product.skus?.[0] || product.modelo || product.slug;

  return {
    id: product.slug,
    sku,
    nombre: product.nombre_comercial,
    marca: product.marca,
    [categoryKey]: product.categoria_comercial,
    [genderKey]: product.genero,
    color: product.color,
    colores: [product.color].filter(Boolean),
    tallas: product.tallasDisponibles,
    precio: normalizePrice(product.precio),
    precio_mayorista: normalizePrice(product.precio_mayorista) || "Precio mayorista por WhatsApp",
    estado: product.disponibleTotal > 0 ? "Disponible" : "Agotado",
    nuevo: Boolean(product.nuevo),
    destacado: Boolean(product.destacado),
    imagen: product.imagen_principal,
    [galleryKey]: gallery,
    [descriptionKey]: product.descripcion_larga || product.descripcion_corta
  };
}

function buildPublishPlan(enrichedProducts) {
  const candidates = enrichedProducts.filter((product) => product.publicable === true);
  const validationIssues = candidates
    .map((product) => ({ product, missing: validatePublishableProduct(product) }))
    .filter((item) => item.missing.length > 0);
  const publicProducts = candidates.map(toPublicProduct);

  return {
    generatedAt: new Date().toISOString(),
    mode: publishMode ? "publish" : "preview",
    source: "catalog-data/exports/stylus-products.enriched.json",
    previewOutput: "catalog-data/exports/products.preview.json",
    publicOutput: "data/products.json",
    backupOutput: "data/products.backup.json",
    totals: {
      enrichedProducts: enrichedProducts.length,
      publicableCandidates: candidates.length,
      validationIssues: validationIssues.length,
      productsForPublicCatalog: publicProducts.length
    },
    candidates,
    validationIssues,
    publicProducts
  };
}

function assertPublishAllowed(plan) {
  const blockingReasons = [];
  if (plan.publicProducts.length < 1) blockingReasons.push("No existe al menos 1 producto publicable.");
  if (plan.validationIssues.length > 0) blockingReasons.push("Hay productos publicables con campos obligatorios faltantes.");
  return blockingReasons;
}

function renderPreviewReport(plan) {
  return [
    "# Preview de publicacion STYLUS",
    "",
    `- Generado: ${plan.generatedAt}`,
    `- Fuente: \`${plan.source}\``,
    `- Preview: \`${plan.previewOutput}\``,
    "- Catalogo publico: `data/products.json` no fue modificado.",
    "",
    "## Totales",
    "",
    `- Productos enriquecidos: ${plan.totals.enrichedProducts}`,
    `- Candidatos publicables: ${plan.totals.publicableCandidates}`,
    `- Productos en preview: ${plan.totals.productsForPublicCatalog}`,
    `- Bloqueos de validacion: ${plan.totals.validationIssues}`,
    "",
    "## Productos en preview",
    "",
    plan.publicProducts.length
      ? table(
          ["ID", "SKU", "Nombre", "Categoria", "Genero", "Tallas", "Imagen"],
          plan.publicProducts.map((product) => [
            product.id,
            product.sku,
            product.nombre,
            product[categoryKey],
            product[genderKey],
            product.tallas.join(", "),
            product.imagen
          ])
        )
      : "No hay productos publicables para preview.\n",
    plan.validationIssues.length ? ["", "## Bloqueos", "", renderValidationIssues(plan.validationIssues)].join("\n") : ""
  ].join("\n");
}

function renderResultReport(plan, status, blockingReasons = []) {
  return [
    "# Resultado de publicacion STYLUS",
    "",
    `- Generado: ${new Date().toISOString()}`,
    `- Modo: ${plan.mode}`,
    `- Estado: ${status}`,
    `- Catalogo publico: ${status === "PUBLICADO" ? "`data/products.json` actualizado con backup previo." : "`data/products.json` no fue modificado."}`,
    `- Backup: ${status === "PUBLICADO" ? "`data/products.backup.json`" : "no generado"}`,
    "",
    "## Totales",
    "",
    `- Productos enriquecidos: ${plan.totals.enrichedProducts}`,
    `- Candidatos publicables: ${plan.totals.publicableCandidates}`,
    `- Productos para catalogo publico: ${plan.totals.productsForPublicCatalog}`,
    `- Bloqueos de validacion: ${plan.totals.validationIssues}`,
    "",
    blockingReasons.length ? ["## Bloqueos", "", ...blockingReasons.map((reason) => `- ${reason}`), ""].join("\n") : "",
    plan.validationIssues.length ? ["## Campos faltantes", "", renderValidationIssues(plan.validationIssues)].join("\n") : ""
  ].join("\n");
}

function renderValidationIssues(issues) {
  return table(
    ["Slug", "Modelo", "Nombre comercial", "Campos faltantes"],
    issues.map(({ product, missing }) => [
      product.slug || "",
      product.modelo || "",
      product.nombre_comercial || "",
      missing.join(", ")
    ])
  );
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

async function main() {
  const enrichedPayload = JSON.parse(await readFile(enrichedInputPath, "utf8"));
  const plan = buildPublishPlan(getEnrichedProducts(enrichedPayload));
  const blockingReasons = assertPublishAllowed(plan);

  await mkdir(path.dirname(previewOutputPath), { recursive: true });
  await mkdir(reportsDir, { recursive: true });
  await writeFile(previewOutputPath, `${JSON.stringify(plan.publicProducts, null, 2)}\n`, "utf8");
  await writeFile(previewReportPath, `${renderPreviewReport(plan)}\n`, "utf8");

  if (previewMode) {
    await writeFile(resultReportPath, `${renderResultReport(plan, "PREVIEW_GENERADO")}\n`, "utf8");
    console.log(`Preview generado: ${plan.publicProducts.length} productos publicables.`);
    console.log("data/products.json no fue modificado.");
    return;
  }

  if (blockingReasons.length > 0) {
    await writeFile(resultReportPath, `${renderResultReport(plan, "BLOQUEADO", blockingReasons)}\n`, "utf8");
    console.error(`Publicacion bloqueada: ${blockingReasons.join(" ")}`);
    console.error("data/products.json no fue modificado.");
    process.exitCode = 1;
    return;
  }

  await copyFile(publicOutputPath, backupOutputPath);
  await writeFile(publicOutputPath, `${JSON.stringify(plan.publicProducts, null, 2)}\n`, "utf8");
  await writeFile(resultReportPath, `${renderResultReport(plan, "PUBLICADO")}\n`, "utf8");
  console.log(`Catalogo STYLUS publicado: ${plan.publicProducts.length} productos.`);
  console.log("Backup creado en data/products.backup.json.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
