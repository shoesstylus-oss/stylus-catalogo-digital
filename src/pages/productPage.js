import { qs } from "../utils/dom.js";
import { loadDictionary } from "../utils/i18n.js";
import { getProductById, getRelatedProducts, loadProducts } from "../utils/products.js";
import { registerServiceWorker } from "../utils/pwa.js";
import { productDetail, productNotFound } from "../components/ProductDetail.js";

const detailRoot = qs("#product-detail");

async function init() {
  await loadDictionary();
  const products = await loadProducts();
  const params = new URLSearchParams(window.location.search);
  const product = getProductById(products, params.get("id"));

  if (!product) {
    detailRoot.innerHTML = productNotFound();
    return;
  }

  document.title = `${product.nombre} | STYLUS`;
  detailRoot.innerHTML = productDetail(product, getRelatedProducts(products, product));
  registerServiceWorker("..");
}

init().catch((error) => {
  detailRoot.innerHTML = `<p class="empty-state">${error.message}</p>`;
});
