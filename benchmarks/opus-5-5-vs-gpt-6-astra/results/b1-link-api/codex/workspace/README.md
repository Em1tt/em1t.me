# Link shortener API

Requires Node.js 24. No external dependencies or compilation are needed.

Set `PORT`, `DB_PATH`, and `API_TOKEN`, then run `npm start`. `PORT` defaults to
3000 and `DB_PATH` defaults to `links.sqlite` in the current directory.
`API_TOKEN` must be a nonempty secret.

For example, in PowerShell:

```powershell
$env:PORT = '3000'
$env:DB_PATH = "$PWD/links.sqlite"
$env:API_TOKEN = 'replace-with-your-secret'
npm start
```

Create a link with `POST /api/links`, an `Authorization: Bearer <API_TOKEN>`
header, and a JSON body such as `{"url":"https://example.com/docs","slug":"docs"}`.
The slug is optional. Read links at `GET /api/links/:slug`, list them at
`GET /api/links?limit=20`, and follow them at `GET /:slug`.
Pass a returned `nextCursor` as the `cursor` query parameter for the next page.
Malformed cursors return `400 {"error":"invalid_cursor"}`.

`GET /api/links/:slug/stats` returns the total clicks and seven UTC daily counts.
`DELETE /api/links/:slug` requires the same authorization header and deletes the
link and all its click events.

SQLite stores links, individual click timestamps, and rate-limit state in the
single database file. Every creation attempt counts toward the rolling limit
of 30 per 60 seconds, including failed and rate-limited requests. Client IPs
come from the TCP connection; forwarded headers are not trusted.

Run `npm test` for the integration suite.
