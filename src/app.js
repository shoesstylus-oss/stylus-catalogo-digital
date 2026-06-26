import { WHATSAPP_NUMBER, products } from "./products.js";

const grid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#search");
const categoryFilters = document.querySelector("#category-filters");
const emptyState = document.querySelector("#empty-state");
const productCount = document.querySelector("#product-count");

let activeCategory = "Todos";

function createProductImage(product) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 460" role="img" aria-label="${product.name}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${product.accent}" stop-opacity=".95"/>
          <stop offset="1" stop-color="#111827"/>
        </linearGradient>
      </defs>
      <rect width="640" height="460" rx="36" fill="url(#bg)"/>
      <circle cx="496" cy="98" r="84" fill="#ffffff" opacity=".12"/>
      <circle cx="118" cy="348" r="112" fill="#ffffff" opacity=".08"/>
      <path d="M146 286c65-28 121-43 183-43 59 0 109 14 165 43 15 8 24 24 20 41l-8 32H116l6-30c4-20 13-35 24-43Z" fill="#fff" opacity=".9"/>
      <path d="M181 261c34-65 76-102 130-112 46 37 94 74 144 112H181Z" fill="#f7f7f7" opacity=".78"/>
      <path d="M242 223h122" stroke="${product.accent}" stroke-width="16" stroke-linecap="round" opacity=".88"/>
      <text x="52" y="86" fill="#fff" font-size="40" font-family="Inter, Arial" font-weight="800">STYLUS</text>
      <text x="52" y="132" fill="#fff" font-size="25" font-family="Inter, Arial" opacity=".82">${product.imageLabel}</text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function whatsappLink(product) {
  const text = `Hola STYLUS, quiero informacion para pedido mayorista de ${product.name} (${product.category}) en tallas ${product.sizes.join(", ")}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function renderCategoryFilters() {
  const categories = ["Todos", ...new Set(products.map((product) => product.category))];

  categoryFilters.innerHTML = categories
    .map(
      (category) => `
        <button
          class="filter-chip${category === activeCategory ? " is-active" : ""}"
          type="button"
          data-category="${category}"
          aria-pressed="${category === activeCategory}"
        >
          ${category}
        </button>
      `
    )
    .join("");
}

function productMatchesSearch(product, query) {
  const haystack = [
    product.name,
    product.category,
    product.price,
    product.description,
    product.sizes.join(" ")
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function getVisibleProducts() {
  const query = searchInput.value.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
    const matchesSearch = query.length === 0 || productMatchesSearch(product, query);
    return matchesCategory && matchesSearch;
  });
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();

  productCount.textContent = `${visibleProducts.length} producto${visibleProducts.length === 1 ? "" : "s"}`;
  emptyState.hidden = visibleProducts.length > 0;

  grid.innerHTML = visibleProducts
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-media">
            <img src="${createProductImage(product)}" alt="${product.name}" loading="lazy">
            ${product.featured ? '<span class="badge">Destacado</span>' : ""}
          </div>
          <div class="product-body">
            <div>
              <p class="category">${product.category}</p>
              <h3>${product.name}</h3>
              <p class="description">${product.description}</p>
            </div>
            <div class="sizes" aria-label="Tallas disponibles">
              ${product.sizes.map((size) => `<span>${size}</span>`).join("")}
            </div>
            <div class="product-footer">
              <strong>${product.price}</strong>
              <a href="${whatsappLink(product)}" target="_blank" rel="noreferrer">Pedir</a>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");

  if (!button) {
    return;
  }

  activeCategory = button.dataset.category;
  renderCategoryFilters();
  renderProducts();
});

searchInput.addEventListener("input", renderProducts);

renderCategoryFilters();
renderProducts();
