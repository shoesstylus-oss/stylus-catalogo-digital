const CACHE_NAME = "stylus-platform-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./pages/product.html",
  "./src/styles.css",
  "./src/pages/catalogPage.js",
  "./src/pages/productPage.js",
  "./src/components/FilterPanel.js",
  "./src/components/ProductCard.js",
  "./src/components/ProductDetail.js",
  "./src/utils/config.js",
  "./src/utils/dom.js",
  "./src/utils/filters.js",
  "./src/utils/format.js",
  "./src/utils/i18n.js",
  "./src/utils/products.js",
  "./src/utils/pwa.js",
  "./src/utils/search.js",
  "./src/utils/whatsapp.js",
  "./data/products.json",
  "./data/i18n.es.json",
  "./assets/logo/favicon.png",
  "./assets/logo/stylus-icon.png",
  "./assets/logo/stylus-logo-horizontal.png",
  "./assets/products/camiseta-deportiva.svg",
  "./assets/products/conjunto-deportivo-dama.svg",
  "./assets/products/gorra-deportiva.svg",
  "./assets/products/mochila-deportiva.svg",
  "./assets/products/tenis-deportivo-hombre.svg",
  "./assets/products/tenis-urbano-deportivo.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
