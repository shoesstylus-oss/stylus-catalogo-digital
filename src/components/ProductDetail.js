import { imagePath } from "../utils/format.js";
import { escapeHtml } from "../utils/dom.js";
import { t } from "../utils/i18n.js";
import { productWhatsappUrl } from "../utils/whatsapp.js";
import { productCard } from "./ProductCard.js";

export function productDetail(product, relatedProducts) {
  const gallery = (product.galería?.length ? product.galería : [product.imagen])
    .map(
      (image) => `
        <figure class="gallery-frame">
          <img src="${imagePath(image, "..")}" alt="${escapeHtml(product.nombre)}" loading="lazy" width="900" height="640">
        </figure>
      `
    )
    .join("");

  return `
    <article class="detail-layout">
      <section class="product-gallery" aria-label="${t("detail.gallery")}">
        ${gallery}
      </section>
      <section class="detail-panel">
        <p class="eyebrow">${escapeHtml(product.marca)} / ${escapeHtml(product["categoría"])}</p>
        <h1>${escapeHtml(product.nombre)}</h1>
        <div class="tag-row">
          ${product.nuevo ? `<span class="tag tag-new">${t("labels.new")}</span>` : ""}
          ${product.destacado ? `<span class="tag tag-featured">${t("labels.featured")}</span>` : ""}
        </div>
        <p class="detail-description">${escapeHtml(product.descripción)}</p>
        <dl class="detail-specs">
          <div><dt>${t("labels.sku")}</dt><dd>${escapeHtml(product.sku)}</dd></div>
          <div><dt>${t("labels.sizes")}</dt><dd>${product.tallas.map(escapeHtml).join(", ")}</dd></div>
          <div><dt>${t("filters.color")}</dt><dd>${escapeHtml(product.color)}</dd></div>
          <div><dt>${t("filters.gender")}</dt><dd>${escapeHtml(product["género"])}</dd></div>
          <div><dt>${t("labels.status")}</dt><dd>${escapeHtml(product.estado)}</dd></div>
        </dl>
        <div class="detail-price">
          <strong>${escapeHtml(product.precio)}</strong>
          <span>${escapeHtml(product.precio_mayorista)}</span>
        </div>
        <a class="button button-primary button-wide" href="${productWhatsappUrl(product)}" target="_blank" rel="noreferrer">${t("actions.buyWhatsapp")}</a>
      </section>
    </article>
    <section class="related-section" aria-labelledby="related-title">
      <div class="workspace-toolbar">
        <div>
          <p class="eyebrow">${t("labels.related")}</p>
          <h2 id="related-title">${t("labels.related")}</h2>
        </div>
      </div>
      <div class="product-grid related-grid">
        ${relatedProducts.map((item) => productCard(item, "", "..")).join("")}
      </div>
    </section>
  `;
}

export function productNotFound() {
  return `
    <section class="not-found">
      <p class="eyebrow">${t("detail.notFound")}</p>
      <h1>${t("detail.notFound")}</h1>
      <p>${t("detail.notFoundCopy")}</p>
      <a class="button button-primary" href="../">${t("nav.backToCatalog")}</a>
    </section>
  `;
}
