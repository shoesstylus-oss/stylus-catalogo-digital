export function imagePath(path, base = ".") {
  if (path.startsWith("http") || path.startsWith("../")) return path;
  return `${base}/${path}`;
}

export function productUrl(id, base = ".") {
  return `${base}/pages/product.html?id=${encodeURIComponent(id)}`;
}
