import { DATA_PATHS } from "./config.js";

export async function loadProducts() {
  const response = await fetch(DATA_PATHS.products);
  if (!response.ok) {
    throw new Error("No se pudo cargar la base de productos.");
  }
  return response.json();
}

export function getProductById(products, id) {
  return products.find((product) => product.id === id);
}

export function getRelatedProducts(products, product, limit = 3) {
  return products
    .filter((candidate) => candidate.id !== product.id)
    .filter((candidate) => candidate["categoría"] === product["categoría"] || candidate["género"] === product["género"])
    .slice(0, limit);
}
