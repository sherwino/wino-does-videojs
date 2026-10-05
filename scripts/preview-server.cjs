// Development preview only. Static publishing continues to use dist/.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve("dist");
const fixtureRoot = path.resolve("tests/fixtures/hls");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".ico": "image/x-icon", ".m3u8": "application/vnd.apple.mpegurl", ".ts": "video/mp2t" };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://preview");
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch (_) {
    res.writeHead(400); return res.end("Invalid path");
  }
  const fixture = pathname.startsWith("/fixtures/");
  const base = fixture ? fixtureRoot : root;
  const relative = fixture ? pathname.slice("/fixtures/".length) : pathname.slice(1) || "index.html";
  const file = path.resolve(base, relative);
  if (!file.startsWith(base + path.sep)) {
    res.writeHead(403); return res.end("Forbidden");
  }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Content-Length": stat.size,
      "Cache-Control": "no-store",
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
}).listen(5000, "0.0.0.0", () => console.log("Player preview listening on port 5000"));
