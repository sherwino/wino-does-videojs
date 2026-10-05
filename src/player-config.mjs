// Kept independent of the DOM so URL and playback policy regressions are testable.
function convertOption(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !isNaN(Number(value))) return Number(value);
  return value;
}

export function parsePlayerQuery(search) {
  const params = Object.create(null);
  for (const pair of search.replace(/^\?/, "").split("&")) {
    if (!pair) continue;
    const separator = pair.indexOf("=");
    const rawKey = separator < 0 ? pair : pair.slice(0, separator);
    const rawValue = separator < 0 ? "" : pair.slice(separator + 1);
    let key;
    let value;
    try {
      key = decodeURIComponent(rawKey.replace(/\+/g, " "));
      value = decodeURIComponent(rawValue.replace(/\+/g, " "));
    } catch (_) {
      throw new Error("Invalid URL encoding. Encode the complete source URL with encodeURIComponent().");
    }
    if (["__proto__", "constructor", "prototype"].includes(key)) {
      throw new Error("Unsupported player option name.");
    }
    if (key === "source" || key === "version") {
      // Media URLs must never undergo boolean, numeric, or comma-array conversion.
      params[key] = value;
    } else {
      params[key] = value.includes(",")
        ? value.split(",").map(convertOption)
        : convertOption(value);
    }
  }
  if ("source" in params && !params.source.trim()) {
    throw new Error("The source parameter is empty. Provide a stitched HLS playback URL.");
  }
  if ("version" in params && !/^\d+\.\d+\.\d+$/.test(params.version)) {
    throw new Error("Invalid Video.js version. Use a version such as 7.14.3.");
  }
  return params;
}

export function applyPlaybackPolicy(options) {
  const result = { ...options };
  if (result.muted === undefined) {
    result.muted = Boolean(result.autoplay);
  }
  // Respect explicit audible playback, which may require pressing Play.
  if (result.autoplay === true && result.muted) {
    result.autoplay = "muted";
  }
  // Never unmute on a download/progress event: it is not a user gesture.
  return result;
}

export function displayParams(params) {
  const safe = { ...params };
  if ("source" in safe) safe.source = "[provided HLS URL; hidden]";
  return safe;
}
