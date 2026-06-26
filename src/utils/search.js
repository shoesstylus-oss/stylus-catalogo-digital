import { escapeHtml, normalize } from "./dom.js";

export function highlightMatch(value, query) {
  const text = String(value);
  const cleanQuery = normalize(query).trim();
  if (!cleanQuery) return escapeHtml(text);

  const normalizedText = normalize(text);
  const index = normalizedText.indexOf(cleanQuery);
  if (index === -1) return escapeHtml(text);

  const before = text.slice(0, index);
  const match = text.slice(index, index + cleanQuery.length);
  const after = text.slice(index + cleanQuery.length);

  return `${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}`;
}
