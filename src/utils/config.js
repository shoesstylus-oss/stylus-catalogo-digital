export const APP_BASE = document.body.dataset.page === "product" ? ".." : ".";
export const DATA_PATHS = {
  products: `${APP_BASE}/data/products.json`,
  i18n: `${APP_BASE}/data/i18n.es.json`
};

export const PRODUCT_PAGE = `${APP_BASE}/pages/product.html`;
