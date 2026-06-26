import { qs } from "../utils/dom.js";
import { createInitialFilters, productMatchesFilters } from "../utils/filters.js";
import { loadDictionary, t } from "../utils/i18n.js";
import { loadProducts } from "../utils/products.js";
import { registerServiceWorker } from "../utils/pwa.js";
import { productCard } from "../components/ProductCard.js";
import { renderActiveFilters, renderFilters } from "../components/FilterPanel.js";

const state = {
  products: [],
  filters: createInitialFilters()
};

const nodes = {
  search: qs("#search"),
  grid: qs("#product-grid"),
  filters: qs("#filter-root"),
  activeFilters: qs("#active-filters"),
  resultCount: qs("#result-count"),
  emptyState: qs("#empty-state"),
  metricProducts: qs("#metric-products"),
  metricBrands: qs("#metric-brands"),
  metricFeatured: qs("#metric-featured")
};

function updateMetrics() {
  nodes.metricProducts.textContent = state.products.length;
  nodes.metricBrands.textContent = new Set(state.products.map((product) => product.marca)).size;
  nodes.metricFeatured.textContent = state.products.filter((product) => product.destacado).length;
}

function getVisibleProducts() {
  return state.products.filter((product) => productMatchesFilters(product, state.filters));
}

function renderCatalog() {
  const visibleProducts = getVisibleProducts();
  nodes.resultCount.textContent = visibleProducts.length === 1
    ? t("catalog.oneResult")
    : t("catalog.manyResults", { count: visibleProducts.length });
  nodes.emptyState.hidden = visibleProducts.length > 0;
  nodes.grid.innerHTML = visibleProducts.map((product) => productCard(product, state.filters.query)).join("");
  renderActiveFilters(nodes.activeFilters, state.filters);
}

function bindEvents() {
  nodes.search.addEventListener("input", (event) => {
    state.filters.query = event.target.value;
    renderCatalog();
  });

  nodes.search.addEventListener("change", (event) => {
    state.filters.query = event.target.value;
    renderCatalog();
  });

  nodes.filters.addEventListener("change", (event) => {
    const field = event.target.dataset.filter;
    const flag = event.target.dataset.flag;

    if (field) {
      if (event.target.checked) {
        state.filters[field].add(event.target.value);
      } else {
        state.filters[field].delete(event.target.value);
      }
    }

    if (flag) {
      state.filters[flag] = event.target.checked;
    }

    renderCatalog();
  });

  nodes.filters.addEventListener("click", (event) => {
    if (!event.target.closest("[data-clear-filters]")) return;
    state.filters = createInitialFilters();
    nodes.search.value = "";
    renderFilters(nodes.filters, state.products, state.filters);
    renderCatalog();
  });

  nodes.activeFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-filter]");
    if (!button) return;

    const key = button.dataset.removeFilter;
    const value = button.dataset.value;
    if (state.filters[key] instanceof Set) {
      state.filters[key].delete(value);
    } else {
      state.filters[key] = false;
    }

    renderFilters(nodes.filters, state.products, state.filters);
    renderCatalog();
  });
}

async function init() {
  await loadDictionary();
  state.products = await loadProducts();
  updateMetrics();
  renderFilters(nodes.filters, state.products, state.filters);
  renderCatalog();
  bindEvents();
  registerServiceWorker(".");
}

init().catch((error) => {
  nodes.grid.innerHTML = `<p class="empty-state">${error.message}</p>`;
});
