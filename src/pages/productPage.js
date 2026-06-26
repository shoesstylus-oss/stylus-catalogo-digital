import { qs } from "../utils/dom.js";
import { loadDictionary } from "../utils/i18n.js";
import { getProductById, getRelatedProducts, loadProducts } from "../utils/products.js";
import { registerServiceWorker } from "../utils/pwa.js";
import { productDetail, productNotFound } from "../components/ProductDetail.js";
import { imagePath } from "../utils/format.js";

const detailRoot = qs("#product-detail");

function setMeta(name, content, attribute = "name") {
  let node = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, name);
    document.head.append(node);
  }
  node.setAttribute("content", content);
}

function addProductStructuredData(product) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nombre,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.marca
    },
    category: product["categoría"],
    color: product.colores?.join(", ") || product.color,
    description: product.descripción,
    image: imagePath(product.imagen, ".."),
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "NIO",
      price: "0",
      url: window.location.href
    }
  });
  document.head.append(script);
}

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
  setMeta("description", product.descripción);
  setMeta("og:title", `${product.nombre} | STYLUS`, "property");
  setMeta("og:description", product.descripción, "property");
  setMeta("og:image", imagePath(product.imagen, ".."), "property");
  setMeta("twitter:title", `${product.nombre} | STYLUS`);
  setMeta("twitter:description", product.descripción);
  addProductStructuredData(product);
  detailRoot.innerHTML = productDetail(product, getRelatedProducts(products, product));
  registerServiceWorker("..");
}

init().catch((error) => {
  detailRoot.innerHTML = `<p class="empty-state">${error.message}</p>`;
});
