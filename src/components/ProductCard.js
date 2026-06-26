import { imagePath, productUrl } from "../utils/format.js";
import { escapeHtml } from "../utils/dom.js";
import { highlightMatch } from "../utils/search.js";
import { t } from "../utils/i18n.js";
import { productWhatsappUrl } from "../utils/whatsapp.js";

export function productCard(product, query = "", base = ".") {
  const badges = [
    product.nuevo ? `<span class="tag tag-new">${t("labels.new")}</span>` : "",
    product.destacado ? `<span class="tag tag-featured">${t("labels.featured")}</span>` : ""
  ].join("");

  return `
    <article class="product-card">
      <a class="product-media" href="${productUrl(product.id, base)}" aria-label="${escapeHtml(product.nombre)}">
        <img src="${imagePath(product.imagen, base)}" alt="${escapeHtml(product.nombre)}" loading="lazy" width="900" height="640">
        <span class="tag-row">${badges}</span>
      </a>
      <div class="product-body">
        <div class="product-kicker">
          <span>${highlightMatch(product.marca, query)}</span>
          <small>${t("labels.sku")} ${highlightMatch(product.sku, query)}</small>
        </div>
        <h3>${highlightMatch(product.nombre, query)}</h3>
        <p>${highlightMatch(product.descripción, query)}</p>
        <div class="product-specs">
          <span>${escapeHtml(product["categoría"])}</span>
          <span>${escapeHtml(product["género"])}</span>
          <span>${escapeHtml(product.color)}</span>
        </div>
        <div class="commercial-row">
          <strong>${escapeHtml(product.precio)}</strong>
          <small>${escapeHtml(product.precio_mayorista)}</small>
        </div>
        <div class="product-actions">
          <a class="button button-primary" href="${productWhatsappUrl(product)}" target="_blank" rel="noreferrer">${t("actions.whatsapp")}</a>
          <a class="button button-secondary" href="${productUrl(product.id, base)}">${t("actions.viewMore")}</a>
        </div>
      </div>
    </article>
  `;
}
