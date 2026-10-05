function absoluteSource(src, baseUrl) {
  try { return new URL(src, baseUrl).href; } catch (_) { return ""; }
}

export function safeSourceLabel(src, baseUrl) {
  try {
    const url = new URL(src, baseUrl);
    // Never expose query signatures, fragments, or URL user/password credentials.
    return `${url.host}${url.pathname}`;
  } catch (_) {
    return "[invalid source URL]";
  }
}

export function describeMediaSource(src, { baseUrl, providedSource, entries = [], fallbackSources = {} }) {
  if (!src) return "Media: Waiting for a source";
  const actual = absoluteSource(src, baseUrl);
  if (providedSource && actual === absoluteSource(providedSource, baseUrl)) {
    return `Media: URL source — ${safeSourceLabel(src, baseUrl)}`;
  }
  const index = entries.findIndex((entry) =>
    entry.content && absoluteSource(entry.content.src, baseUrl) === actual);
  if (index >= 0) {
    return `Media: ${entries[index].title || "Untitled stream"} (${index + 1}/${entries.length})`;
  }
  const fallbackKey = Object.keys(fallbackSources).find((key) =>
    absoluteSource(fallbackSources[key], baseUrl) === actual);
  if (fallbackKey) return `Media: ${fallbackKey} — ${safeSourceLabel(src, baseUrl)}`;
  return `Media: Custom source — ${safeSourceLabel(src, baseUrl)}`;
}
