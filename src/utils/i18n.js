import { DATA_PATHS } from "./config.js";

let dictionary = {};

export async function loadDictionary() {
  const response = await fetch(DATA_PATHS.i18n);
  dictionary = await response.json();
  applyDocumentTranslations();
  return dictionary;
}

export function t(path, params = {}) {
  const value = path.split(".").reduce((current, key) => current?.[key], dictionary) ?? path;
  return Object.entries(params).reduce((text, [key, replacement]) => text.replaceAll(`{${key}}`, replacement), value);
}

export function applyDocumentTranslations(scope = document) {
  scope.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });

  scope.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
  });
}
