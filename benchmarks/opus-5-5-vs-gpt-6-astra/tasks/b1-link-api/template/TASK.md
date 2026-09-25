# Task: link shortener API

Build the HTTP API for a link shortener in Node.js 24 (JavaScript or TypeScript that Node can run).
You may use any npm packages.

- `npm start` must start the server. It listens on the port in the `PORT` environment variable.
- Data must persist in the single file named by the `DB_PATH` environment variable, so restarting
  the server with the same `DB_PATH` keeps everything. Node 24 has SQLite built in (`node:sqlite`);
  you may use that or anything else that keeps the data in that one file.
- `API_TOKEN` (environment variable) is the secret for the write endpoints.
- When you finish, the project must be ready to run: dependencies installed and anything that
  needs building built.

Automated tests will call the API and check status codes, headers and bodies exactly.

## Links

A link is returned as this JSON object:

```json
{ "slug": "docs", "url": "https://example.com/docs", "createdAt": "2026-09-25T10:00:00.000Z", "clicks": 0 }
```

`createdAt` is an ISO 8601 timestamp, and `clicks` is how many times the short link was followed.

## Endpoints

| Method and path                 | Auth | Success                                                     |
| ------------------------------- | ---- | ----------------------------------------------------------- |
| `POST /api/links`               | yes  | `201` with the new link                                     |
| `GET /api/links`                | no   | `200` with `{ "items": [links], "nextCursor": string or null }` |
| `GET /api/links/:slug`          | no   | `200` with the link                                         |
| `DELETE /api/links/:slug`       | yes  | `204`, no body                                              |
| `GET /api/links/:slug/stats`    | no   | `200` with the stats (below)                                |
| `GET /:slug`                    | no   | `302` redirect to the link's URL (`Location` header)        |

**Creating** (`POST /api/links`) takes a JSON body `{ "url": "...", "slug": "..." }`:

- `url` is required: an absolute `http:` or `https:` URL (it must parse with `new URL()`), at
  most 2048 characters. Otherwise `400 { "error": "invalid_url" }`.
- `slug` is optional: 3 to 32 characters from `A–Z a–z 0–9 _ -`. Slugs are case-sensitive
  (`Docs` and `docs` are different links). `api` is reserved in any case (`api`, `API`, ...).
  An invalid slug gives `400 { "error": "invalid_slug" }`; one that's already in use gives
  `409 { "error": "slug_taken" }`.
- Without a slug, generate a unique one of exactly 7 characters from `A–Z a–z 0–9`.
- A body that isn't valid JSON, or isn't a JSON object, gives `400 { "error": "invalid_json" }`.
- Check in this order: rate limit, then authentication, then the JSON, then `url`, then `slug`.

**Listing** (`GET /api/links?limit=&cursor=`) returns links newest first (in the reverse of the
order they were created), `limit` per page (default 20, at most 100). `nextCursor` is an opaque
string that fetches the next page when passed as `cursor`, or `null` on the last page. A `limit`
that isn't an integer from 1 to 100 gives `400 { "error": "invalid_limit" }`.

**Following** (`GET /:slug`) redirects with `302` and adds one click. It records the time of each
click.

**Stats** (`GET /api/links/:slug/stats`) returns

```json
{ "slug": "docs", "clicks": 3, "daily": [{ "date": "2026-09-19", "clicks": 0 }, ..., { "date": "2026-09-25", "clicks": 3 }] }
```

`daily` has exactly 7 entries, one per UTC day, from 6 days ago to today, oldest first, with
days without clicks as `0`.

**Deleting** removes the link and its clicks.

## Errors

- Unknown slug (for any endpoint above) or an unknown route: `404 { "error": "not_found" }`.
- `POST` and `DELETE` need the header `Authorization: Bearer <API_TOKEN>`. Missing or wrong:
  `401 { "error": "unauthorized" }`.
- Every JSON response, errors included, has `Content-Type: application/json`.

## Rate limit

Each client IP address may make at most 30 `POST /api/links` requests in any 60-second window
(a rolling window, not per clock minute). Every such request counts, whatever its outcome. The
31st gets `429 { "error": "rate_limited" }` with a `Retry-After` header: the whole number of
seconds, from 1 to 60, until another request would be allowed.
