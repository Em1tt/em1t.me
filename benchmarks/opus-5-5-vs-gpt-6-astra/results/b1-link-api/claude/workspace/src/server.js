import { createServer } from 'node:http';
import { createApp } from './app.js';
import { RateLimiter } from './rate-limiter.js';
import { LinkStore, openDatabase } from './store.js';

const RATE_LIMIT = { limit: 30, windowMs: 60_000 }; // POST /api/links per client address

const port = readIntegerEnv('PORT', 3000, 0, 65535);
const trustedProxies = readIntegerEnv('TRUST_PROXY', 0, 0, 10);
const dbPath = process.env.DB_PATH || 'links.db';
const apiToken = process.env.API_TOKEN ?? '';
if (!apiToken) console.warn('API_TOKEN is not set, so every POST and DELETE request will be refused.');

const db = openDatabase(dbPath);
const rateLimiter = new RateLimiter(RATE_LIMIT);
setInterval(() => rateLimiter.prune(), RATE_LIMIT.windowMs).unref();

const server = createServer(createApp({ store: new LinkStore(db), apiToken, rateLimiter, trustedProxies }));

server.on('error', (error) => {
  console.error(`Server error: ${error.message}`);
  db.close();
  process.exit(1);
});

server.listen(port, () => {
  console.log(`Link shortener listening on port ${server.address().port} (database: ${dbPath})`);
});

// Every write is committed before its response is sent, so shutting down only has to let
// in-flight requests finish before the database is closed.
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  server.closeIdleConnections();
  setTimeout(() => server.closeAllConnections(), 5_000).unref();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

function readIntegerEnv(name, fallback, min, max) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    console.error(`${name} must be an integer from ${min} to ${max}, got "${raw}".`);
    process.exit(1);
  }
  return value;
}
