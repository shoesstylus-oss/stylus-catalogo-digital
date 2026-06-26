export function registerServiceWorker(base = ".") {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {
      // GitHub Pages and local static previews should keep working even if SW registration fails.
    });
  });
}
