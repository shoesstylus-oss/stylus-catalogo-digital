import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

const kordataInputPath = path.join(rootDir, "catalog-data", "exports", "kordata-products.generated.json");
const pilotDir = path.join(rootDir, "catalog-data", "pilot");
const reportsDir = path.join(rootDir, "catalog-data", "reports");
const pilotOutputPath = path.join(pilotDir, "stylus-pilot-10.generated.csv");
const reportOutputPath = path.join(reportsDir, "pilot-10-summary.md");

const pilotColumns = [
  "modelo",
  "marca",
  "color",
  "categoria_original",
  "nombre_comercial",
  "categoria_comercial",
  "subcategoria_comercial",
  "genero",
  "descripcion_corta",
  "descripcion_larga",
  "precio_mayorista",
  "promocion",
  "nuevo",
  "destacado",
  "etiquetas",
  "imagen_principal",
  "galeria",
  "video_url",
  "slug",
  "estado_enriquecimiento",
  "notas",
  "image_source",
  "image_url",
  "local_path",
  "image_status"
];

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeKeyPart(value = "") {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function slugify(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function csvEscape(value = "") {
  const text = String(value ?? "");
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function table(headers, rows) {
  const headerRow = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((value) => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`);
  return [headerRow, divider, ...body].join("\n");
}

function getProducts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.products)) return payload.products;
  return [];
}

function getAvailableTotal(product) {
  const total = Number(product.disponibleTotal);
  return Number.isFinite(total) ? total : 0;
}

function hasImage(product) {
  return Boolean(
    normalizeText(product.imagen_principal) ||
      normalizeText(product.image_url) ||
      normalizeText(product.local_path) ||
      (Array.isArray(product.galeria) && product.galeria.length)
  );
}

function selectPilotProducts(products) {
  const selectedModels = new Set();
  return products
    .filter((product) => getAvailableTotal(product) > 0)
    .filter((product) => normalizeText(product.modelo) && normalizeText(product.marca))
    .sort((left, right) => getAvailableTotal(right) - getAvailableTotal(left))
    .filter((product) => {
      const modelKey = normalizeKeyPart(product.modelo);
      if (selectedModels.has(modelKey)) return false;
      selectedModels.add(modelKey);
      return true;
    })
    .slice(0, 10);
}

function buildPilotRow(product) {
  const modelo = normalizeText(product.modelo);
  const marca = normalizeText(product.marca);
  const color = normalizeText(product.color);
  const categoriaOriginal = normalizeText(product.categoria || product.categoria_original);
  const slugBase = [modelo, marca, color].filter(Boolean).join(" ");

  return {
    modelo,
    marca,
    color,
    categoria_original: categoriaOriginal,
    nombre_comercial: "",
    categoria_comercial: "",
    subcategoria_comercial: "",
    genero: "",
    descripcion_corta: "",
    descripcion_larga: "",
    precio_mayorista: "",
    promocion: "",
    nuevo: "no",
    destacado: "no",
    etiquetas: "",
    imagen_principal: "",
    galeria: "",
    video_url: "",
    slug: slugify(slugBase),
    estado_enriquecimiento: "PENDIENTE",
    notas: "Piloto generado desde Kordata; completar datos comerciales e imagen antes de preview/publicacion.",
    image_source: "",
    image_url: "",
    local_path: "",
    image_status: "PENDIENTE"
  };
}

function renderCsv(rows) {
  return [
    pilotColumns.join(","),
    ...rows.map((row) => pilotColumns.map((column) => csvEscape(row[column])).join(","))
  ].join("\n");
}

function renderReport({ generatedAt, sourceProducts, selectedProducts }) {
  const productRows = selectedProducts.map((product) => {
    const needsImage = hasImage(product) ? "No" : "Si";
    const recommendedStatus = needsImage === "Si" ? "PENDIENTE" : "EN_REVISION";
    const sizes = Array.isArray(product.tallasDisponibles) ? product.tallasDisponibles.join(", ") : "";

    return [
      product.modelo,
      product.marca,
      product.color,
      product.categoria || product.categoria_original || "",
      getAvailableTotal(product),
      sizes,
      needsImage,
      recommendedStatus
    ];
  });

  return [
    "# Lote piloto 10 STYLUS",
    "",
    `- Generado: ${generatedAt}`,
    "- Fuente: `catalog-data/exports/kordata-products.generated.json`",
    "- CSV generado: `catalog-data/pilot/stylus-pilot-10.generated.csv`",
    "- Catalogo publico: `data/products.json` no fue modificado.",
    "- Costos reales: no incluidos.",
    "- Enriquecimiento operativo: `catalog-data/enrichment/products.enrichment.csv` no fue modificado.",
    "- Mapa de imagenes: `catalog-data/images/image-map.csv` no fue modificado.",
    "",
    "## Totales",
    "",
    `- Productos en export Kordata: ${sourceProducts.length}`,
    `- Productos seleccionados para piloto: ${selectedProducts.length}`,
    "",
    "## Modelos seleccionados",
    "",
    productRows.length
      ? table(
          [
            "Modelo",
            "Marca",
            "Color",
            "Categoria original",
            "Disponibilidad total",
            "Tallas disponibles",
            "Requiere imagen",
            "Estado recomendado"
          ],
          productRows
        )
      : "No hay productos elegibles. Ejecuta primero `npm run import:kordata` con un Excel Kordata local y revisa que existan productos con `disponibleTotal > 0`, modelo y marca.\n"
  ].join("\n");
}

async function main() {
  await mkdir(pilotDir, { recursive: true });
  await mkdir(reportsDir, { recursive: true });

  const payload = JSON.parse(await readFile(kordataInputPath, "utf8"));
  const sourceProducts = getProducts(payload);
  const selectedProducts = selectPilotProducts(sourceProducts);
  const pilotRows = selectedProducts.map(buildPilotRow);
  const generatedAt = new Date().toISOString();

  await writeFile(pilotOutputPath, `${renderCsv(pilotRows)}\n`, "utf8");
  await writeFile(reportOutputPath, `${renderReport({ generatedAt, sourceProducts, selectedProducts })}\n`, "utf8");

  console.log(`Lote piloto generado: ${path.relative(rootDir, pilotOutputPath)}`);
  console.log(`Reporte generado: ${path.relative(rootDir, reportOutputPath)}`);
  console.log(`Productos seleccionados: ${selectedProducts.length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
