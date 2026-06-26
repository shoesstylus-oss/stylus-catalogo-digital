import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const nodeBin = process.execPath;
const importerPath = path.join(rootDir, "integrations", "kordata", "import-kordata-inventory.mjs");
const samplePath = path.join(rootDir, "catalog-data", "kordata", "samples", "kordata-inventory.sample.xlsx");
const outputPath = path.join(rootDir, "catalog-data", "exports", "kordata-products.generated.json");

const expectedColumns = [
  "sku",
  "nombreDelProducto",
  "modelo",
  "talla",
  "color",
  "categoria",
  "marca",
  "precioDeVenta",
  "costo",
  "reservado",
  "disponible",
  "existencia",
  "ubicacion"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function findProduct(products, modelo, marca, color, categoria) {
  return products.find(
    (product) =>
      product.modelo === modelo &&
      product.marca === marca &&
      product.color === color &&
      product.categoria === categoria
  );
}

function findBy(collection, key, value) {
  return collection.find((item) => item[key] === value);
}

await execFileAsync(nodeBin, [importerPath, "--input", samplePath, "--low-stock", "3"], { cwd: rootDir });

const result = JSON.parse(await readFile(outputPath, "utf8"));
const detection = result.headerDetections[0];

assert(result.rowsRead === 4, `Se esperaban 4 filas leidas, se recibieron ${result.rowsRead}.`);
assert(result.productsGrouped === 2, `Se esperaban 2 productos agrupados, se recibieron ${result.productsGrouped}.`);
assert(detection.headerRow === 5, `La fila de encabezados esperada era 5, se detecto ${detection.headerRow}.`);
assert(
  expectedColumns.every((column) => detection.detectedColumns.includes(column)),
  `Columnas detectadas incompletas: ${detection.detectedColumns.join(", ")}`
);

const urbano = findProduct(result.products, "URB-100", "STYLUS", "Blanco", "Tenis");
assert(urbano, "No se encontro el grupo URB-100 + STYLUS + Blanco + Tenis.");
assert(urbano.tallasDisponibles.join(",") === "37,38", `Tallas URB-100 inesperadas: ${urbano.tallasDisponibles.join(",")}.`);
assert(urbano.existenciaTotal === 12, `Existencia total URB-100 esperada 12, recibida ${urbano.existenciaTotal}.`);
assert(urbano.disponibleTotal === 10, `Disponible total URB-100 esperado 10, recibido ${urbano.disponibleTotal}.`);

const talla37 = findBy(urbano.existenciaPorTalla, "talla", "37");
const talla38 = findBy(urbano.existenciaPorTalla, "talla", "38");
assert(talla37?.existencia === 3 && talla37?.disponible === 2, "La talla 37 de URB-100 no consolido existencia/disponible como se esperaba.");
assert(talla38?.existencia === 9 && talla38?.disponible === 8, "La talla 38 de URB-100 no consolido multiples filas como se esperaba.");

const centro = findBy(urbano.existenciaPorSucursal, "ubicacion", "STYLUS Centro");
const masaya = findBy(urbano.existenciaPorSucursal, "ubicacion", "STYLUS Masaya");
assert(centro?.existencia === 8 && centro?.disponible === 7, "STYLUS Centro no consolido la existencia esperada.");
assert(masaya?.existencia === 4 && masaya?.disponible === 3, "STYLUS Masaya no consolido la existencia esperada.");

const sandalia = findProduct(result.products, "SAN-200", "STYLUS", "Negro", "Sandalias");
assert(sandalia?.existenciaTotal === 1 && sandalia?.disponibleTotal === 1, "SAN-200 no conserva el stock bajo esperado.");

console.log("Prueba Kordata sample OK: columnas, agrupacion, tallas, totales y sucursales verificados.");
