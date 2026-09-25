# Link shortener API

An HTTP API for a link shortener. It runs on Node.js 24 with no dependencies: `node:http` for
the server and the built-in `node:sqlite` for storage. There is nothing to build.

```sh
PORT=3000 DB_PATH=./data/links.db API_TOKEN=change-me npm start
npm test
```

| Variable      | Meaning                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------- |
| `PORT`        | Port to listen on (default `3000`).                                                      |
| `DB_PATH`     | SQLite file holding all data (default `links.db`). Missing directories are created.      |
| `API_TOKEN`   | Bearer token for `POST` and `DELETE`. If it is unset, every write gets `401`.            |
| `TRUST_PROXY` | Number of reverse proxies in front of the server (default `0`). See below.               |

## Endpoints

| Method and path              | Auth | Success                                                 |
| ---------------------------- | ---- | ------------------------------------------------------- |
| `POST /api/links`            | yes  | `201` with the new link                                 |
| `GET /api/links`             | no   | `200` with `{ "items": [links], "nextCursor": ... }`    |
| `GET /api/links/:slug`       | no   | `200` with the link                                     |
| `DELETE /api/links/:slug`    | yes  | `204`, no body                                          |
| `GET /api/links/:slug/stats` | no   | `200` with `{ "slug", "clicks", "daily": [7 days] }`    |
| `GET /:slug`                 | no   | `302` to the link's URL, counting one click             |

A link looks like
`{ "slug": "docs", "url": "https://example.com/docs", "createdAt": "2026-09-25T10:00:00.000Z", "clicks": 0 }`.
Errors are `{ "error": "<code>" }`, and every JSON response has `Content-Type: application/json`.

## Behavior where the task leaves room

- **Rate limit.** `POST /api/links` allows 30 requests per client address in any rolling
  60 seconds. It is checked before anything else, so requests count whatever their outcome.
  Refused (`429`) requests are not counted, so a client that waits `Retry-After` seconds is let
  through. The state is kept in memory and resets when the server restarts.
- **Client address.** By default this is the TCP peer address, and `X-Forwarded-For` is ignored
  so clients can't pick their own. Behind proxies, set `TRUST_PROXY` to the number of proxies:
  the address is then read from that many entries from the right of `X-Forwarded-For`.
- **Creating.** `"slug": null` counts as no slug. The body is parsed as JSON whatever its
  `Content-Type`, and bodies over 1 MB get `413 { "error": "payload_too_large" }`. URLs are stored
  exactly as submitted.
- **Redirects.** The `Location` header is the stored URL. If the URL contains characters a header
  can't carry, such as non-ASCII or spaces, its WHATWG serialization is sent instead, which
  percent-encodes them. Redirects carry `Cache-Control: no-store` so that every visit reaches
  the server and is counted. `HEAD /:slug` returns the redirect without counting a click.
- **Listing.** Links are ordered by an `AUTOINCREMENT` id, which SQLite never reuses. A cursor
  therefore stays valid when links are created or deleted between pages. A cursor that wasn't
  issued by the server gets `400 { "error": "invalid_cursor" }`, and an empty `cursor=` means
  the first page.
- **Deleting.** Authentication is checked before the slug is looked up, so a request without the
  token gets `401` even for an unknown slug.
- **Other methods.** A method on a path that isn't in the table, such as `PUT /api/links/x`, gets
  `404 not_found` like any unknown route.
- **Storage.** Each click is stored with its time, and each link keeps a running click count.
  SQLite uses its rollback journal, not WAL, so between writes all data is in the single
  `DB_PATH` file. Every write is committed before its response is sent.

## Layout

- `src/server.js`: reads the environment, starts the server and shuts it down on signals
- `src/app.js`: routing, validation, authentication and responses
- `src/store.js`: SQLite schema and queries
- `src/rate-limiter.js`: sliding-log rate limiter
- `test/`: API tests against the real server process, plus unit tests for the store and the limiter
