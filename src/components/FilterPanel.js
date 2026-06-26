import { FILTER_FIELDS, getActiveFilterLabels, getFilterOptions } from "../utils/filters.js";
import { escapeHtml } from "../utils/dom.js";
import { t } from "../utils/i18n.js";

export function renderFilters(container, products, filters) {
  const groups = FILTER_FIELDS.map((field) => {
    const options = getFilterOptions(products, field.key)
      .map((option) => {
        const checked = filters[field.key].has(option) ? " checked" : "";
        return `
          <label class="filter-option">
            <input type="checkbox" data-filter="${field.key}" value="${escapeHtml(option)}"${checked}>
            <span>${escapeHtml(option)}</span>
          </label>
        `;
      })
      .join("");

    return `
      <fieldset class="filter-group">
        <legend>${t(field.labelKey)}</legend>
        <div class="filter-options">${options}</div>
      </fieldset>
    `;
  }).join("");

  container.innerHTML = `
    ${groups}
    <fieldset class="filter-group">
      <legend>${t("filters.new")}</legend>
      <label class="filter-option">
        <input type="checkbox" data-flag="nuevo"${filters.nuevo ? " checked" : ""}>
        <span>${t("filters.newOnly")}</span>
      </label>
    </fieldset>
    <fieldset class="filter-group">
      <legend>${t("filters.featured")}</legend>
      <label class="filter-option">
        <input type="checkbox" data-flag="destacado"${filters.destacado ? " checked" : ""}>
        <span>${t("filters.featuredOnly")}</span>
      </label>
    </fieldset>
    <button class="button button-ghost" type="button" data-clear-filters>${t("actions.clearFilters")}</button>
  `;
}

export function renderActiveFilters(container, filters) {
  const active = getActiveFilterLabels(filters);
  container.innerHTML = active
    .map(
      ({ key, value }) => `
        <button class="active-filter" type="button" data-remove-filter="${escapeHtml(key)}" data-value="${escapeHtml(value)}">
          ${escapeHtml(value)}
          <span aria-hidden="true">×</span>
          <span class="sr-only">${t("actions.removeFilter")}</span>
        </button>
      `
    )
    .join("");
}
