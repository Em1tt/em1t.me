// A plain static file server for dist/, like the one the site is deployed behind:
// no rewrites and no fallbacks, so a missing file is a 404.
//
//   node scripts/serve.mjs [directory] [port]

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? process.env.PORT ?? 4173);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

async function resolveFile(pathname) {
  const file = resolve(root, `.${decodeURIComponent(pathname)}`);
  if (file !== root && !file.startsWith(root + sep)) return null;
  try {
    const stats = await stat(file);
    if (stats.isFile()) return file;
    if (stats.isDirectory()) {
      const index = join(file, 'index.html');
      if ((await stat(index)).isFile()) return index;
    }
  } catch {
    // Not found.
  }
  return null;
}

const server = createServer(async (request, response) => {
  let file = null;
  try {
    file = await resolveFile(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    // Malformed URL.
  }
  if (!file) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-cache',
  });
  createReadStream(file).pipe(response);
});

server.listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}/`);
});
