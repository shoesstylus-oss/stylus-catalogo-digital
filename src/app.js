import { WHATSAPP_NUMBER, products } from "./products.js";

const grid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#search");
const categoryFilters = document.querySelector("#category-filters");
const emptyState = document.querySelector("#empty-state");
const productCount = document.querySelector("#product-count");
const heroProductTotal = document.querySelector("#hero-product-total");
const heroCategoryTotal = document.querySelector("#hero-category-total");

let activeCategory = "Todos";

function createFallbackImage(product) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 460" role="img" aria-label="${product.name}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${product.accent}" stop-opacity=".96"/>
          <stop offset="1" stop-color="#171a21"/>
        </linearGradient>
      </defs>
      <rect width="640" height="460" rx="34" fill="url(#bg)"/>
      <circle cx="500" cy="98" r="86" fill="#ffffff" opacity=".12"/>
      <circle cx="130" cy="350" r="118" fill="#ffffff" opacity=".08"/>
      <path d="M122 318c72-40 138-60 207-60 62 0 122 18 188 60 15 10 21 31 11 46H109c-9-17-3-37 13-46Z" fill="#fff" opacity=".86"/>
      <path d="M188 278c32-68 77-109 135-122 46 38 95 79 147 122H188Z" fill="#f7f7f7" opacity=".78"/>
      <text x="52" y="88" fill="#fff" font-size="40" font-family="Inter, Arial" font-weight="900">STYLUS</text>
      <text x="52" y="134" fill="#fff" font-size="25" font-family="Inter, Arial" opacity=".82">${product.imageLabel}</text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function whatsappLink(product) {
  const text = `Hola STYLUS, quiero información para pedido mayorista de ${product.name} (${product.sku}) en tallas ${product.sizes.join(", ")}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function renderHeroStats() {
  const categories = new Set(products.map((product) => product.category));
  heroProductTotal.textContent = `${products.length} productos`;
  heroCategoryTotal.textContent = categories.size;
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
    product.sku,
    product.category,
    product.price,
    product.availability,
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
            <img
              src="${product.image}"
              alt="${product.name}"
              loading="lazy"
              data-fallback="${createFallbackImage(product)}"
            >
            ${product.featured ? '<span class="badge">Destacado</span>' : ""}
          </div>
          <div class="product-body">
            <div>
              <div class="product-meta">
                <p class="category">${product.category}</p>
                <span>${product.sku}</span>
              </div>
              <h3>${product.name}</h3>
              <p class="description">${product.description}</p>
            </div>
            <div class="availability">${product.availability}</div>
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

  grid.querySelectorAll("img[data-fallback]").forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        image.src = image.dataset.fallback;
      },
      { once: true }
    );
  });
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

renderHeroStats();
renderCategoryFilters();
renderProducts();
