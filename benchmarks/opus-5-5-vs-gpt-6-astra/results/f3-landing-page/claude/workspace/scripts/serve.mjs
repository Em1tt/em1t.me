// Minimal static file server for local preview and tests.
// Usage: node scripts/serve.mjs [directory=dist]   (port: $PORT or 4173)

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "dist");
const port = Number(process.env.PORT ?? 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

async function resolveFile(urlPath) {
  const file = path.join(root, decodeURIComponent(urlPath));
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  const info = await stat(file).catch(() => null);
  if (info?.isDirectory()) return resolveFile(path.posix.join(urlPath, "index.html"));
  return info?.isFile() ? file : null;
}

createServer(async (request, response) => {
  const { pathname } = new URL(request.url, "http://localhost");
  const file = await resolveFile(pathname).catch(() => null);

  if (!file) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
    return;
  }

  const immutable = /\/assets\/.+\.[0-9a-f]{10}\.\w+$/.test(pathname);
  response.writeHead(200, {
    "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
    "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
  });
  response.end(await readFile(file));
}).listen(port, () => {
  console.log(`Serving ${path.relative(process.cwd(), root) || "."} at http://localhost:${port}`);
});
