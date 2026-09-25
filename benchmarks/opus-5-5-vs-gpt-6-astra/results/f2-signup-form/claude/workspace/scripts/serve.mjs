// A minimal static file server for previewing dist/ and for the browser tests.
// Usage: node scripts/serve.mjs [directory] (defaults to dist/; set PORT to change the port)
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'dist');
const port = Number(process.env.PORT ?? 4317);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

async function resolveFile(urlPath) {
  const file = path.join(root, decodeURIComponent(urlPath));
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  const stats = await stat(file).catch(() => null);
  if (stats?.isDirectory()) return resolveFile(path.posix.join(urlPath, 'index.html'));
  return stats?.isFile() ? file : null;
}

const server = createServer(async (request, response) => {
  let file = null;
  try {
    file = await resolveFile(new URL(request.url, 'http://localhost').pathname);
  } catch {
    // A malformed URL is treated as not found.
  }
  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'Content-Type': contentTypes[path.extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(file).pipe(response);
});

server.listen(port, () => {
  console.log(`Serving ${path.relative(process.cwd(), root) || '.'} at http://localhost:${port}/`);
});
