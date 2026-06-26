import { normalize } from "./dom.js";

export const FILTER_FIELDS = [
  { key: "marca", labelKey: "filters.brand" },
  { key: "categoría", labelKey: "filters.category" },
  { key: "tallas", labelKey: "filters.sizes", multiValue: true },
  { key: "color", labelKey: "filters.color" },
  { key: "género", labelKey: "filters.gender" }
];

export function createInitialFilters() {
  return {
    query: "",
    marca: new Set(),
    categoría: new Set(),
    tallas: new Set(),
    color: new Set(),
    género: new Set(),
    nuevo: false,
    destacado: false
  };
}

export function getFilterOptions(products, field) {
  const values = products.flatMap((product) => {
    const value = product[field];
    return Array.isArray(value) ? value : [value];
  });

  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "es"));
}

export function getActiveFilterLabels(filters) {
  const labels = [];
  FILTER_FIELDS.forEach(({ key }) => {
    filters[key].forEach((value) => labels.push({ key, value }));
  });
  if (filters.nuevo) labels.push({ key: "nuevo", value: "Nuevo" });
  if (filters.destacado) labels.push({ key: "destacado", value: "Destacado" });
  return labels;
}

export function productMatchesFilters(product, filters) {
  const fieldMatches = FILTER_FIELDS.every(({ key, multiValue }) => {
    if (!filters[key].size) return true;
    const productValues = multiValue ? product[key] : [product[key]];
    return productValues.some((value) => filters[key].has(value));
  });

  if (!fieldMatches) return false;
  if (filters.nuevo && !product.nuevo) return false;
  if (filters.destacado && !product.destacado) return false;

  const query = normalize(filters.query);
  if (!query) return true;

  const haystack = [
    product.nombre,
    product.sku,
    product.marca,
    product["categoría"],
    product["género"],
    product.color,
    product.estado,
    product.descripción,
    product.tallas.join(" ")
  ].join(" ");

  return normalize(haystack).includes(query);
}
