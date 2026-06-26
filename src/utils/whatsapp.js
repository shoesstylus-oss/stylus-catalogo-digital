import { t } from "./i18n.js";

export function whatsappUrl(message) {
  return `https://wa.me/${t("whatsapp.phone")}?text=${encodeURIComponent(message)}`;
}

export function productWhatsappUrl(product) {
  return whatsappUrl(t("whatsapp.productMessage", { name: product.nombre, sku: product.sku }));
}
