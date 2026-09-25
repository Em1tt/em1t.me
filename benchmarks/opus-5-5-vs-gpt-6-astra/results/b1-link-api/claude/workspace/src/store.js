import { randomInt } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DAY_MS = 24 * 60 * 60 * 1000;
const STATS_DAYS = 7;
const SLUG_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const GENERATED_SLUG_LENGTH = 7;
const MAX_SLUG_ATTEMPTS = 10;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS links (
    id         INTEGER PRIMARY KEY AUTOINCREMENT, -- never reused, so it also orders links by creation
    slug       TEXT    NOT NULL UNIQUE,           -- default BINARY collation: case-sensitive
    url        TEXT    NOT NULL,
    created_at INTEGER NOT NULL,                  -- Unix time in milliseconds
    clicks     INTEGER NOT NULL DEFAULT 0
  ) STRICT;

  CREATE TABLE IF NOT EXISTS clicks (
    link_id    INTEGER NOT NULL REFERENCES links (id) ON DELETE CASCADE,
    clicked_at INTEGER NOT NULL                   -- Unix time in milliseconds
  ) STRICT;

  CREATE INDEX IF NOT EXISTS clicks_by_link_and_time ON clicks (link_id, clicked_at);
`;

/**
 * Opens the SQLite file at `path` (creating it and its directory if needed) and ensures the schema.
 */
export function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  // The rollback journal only exists while a transaction is being written, so at rest everything
  // lives in the one database file (WAL mode would keep -wal and -shm files next to it).
  db.exec(`
    PRAGMA journal_mode = DELETE;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);
  db.exec(SCHEMA);
  return db;
}

/**
 * Links and their clicks, stored in SQLite.
 *
 * Links are returned in their API shape: `{ slug, url, createdAt, clicks }`.
 */
export class LinkStore {
  #db;
  #now;
  #statements;

  /**
   * @param {DatabaseSync} db an open database, see `openDatabase`
   * @param {{ now?: () => number }} [options] `now` returns the current Unix time in milliseconds
   */
  constructor(db, { now = Date.now } = {}) {
    this.#db = db;
    this.#now = now;
    this.#statements = {
      insert: db.prepare(`
        INSERT INTO links (slug, url, created_at) VALUES (?, ?, ?)
        ON CONFLICT (slug) DO NOTHING
        RETURNING slug, url, created_at, clicks`),
      getBySlug: db.prepare('SELECT id, slug, url, created_at, clicks FROM links WHERE slug = ?'),
      newest: db.prepare(`
        SELECT id, slug, url, created_at, clicks FROM links
        ORDER BY id DESC LIMIT ?`),
      olderThan: db.prepare(`
        SELECT id, slug, url, created_at, clicks FROM links
        WHERE id < ? ORDER BY id DESC LIMIT ?`),
      deleteBySlug: db.prepare('DELETE FROM links WHERE slug = ?'),
      countClick: db.prepare('UPDATE links SET clicks = clicks + 1 WHERE slug = ? RETURNING id, url'),
      insertClick: db.prepare('INSERT INTO clicks (link_id, clicked_at) VALUES (?, ?)'),
      clicksPerDay: db.prepare(`
        SELECT clicked_at / ${DAY_MS} AS day, COUNT(*) AS clicks FROM clicks
        WHERE link_id = ? AND clicked_at >= ? AND clicked_at < ?
        GROUP BY day`),
    };
  }

  /**
   * Creates a link under `slug`, or under a new random slug when `slug` is null.
   * @returns the new link, or null if `slug` is already taken
   */
  create(url, slug = null) {
    if (slug !== null) return this.#insert(url, slug);
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const link = this.#insert(url, randomSlug());
      if (link) return link;
    }
    throw new Error(`No free slug found in ${MAX_SLUG_ATTEMPTS} attempts`);
  }

  /** @returns the link, or null if there is none with this slug */
  get(slug) {
    const row = this.#statements.getBySlug.get(slug);
    return row ? toLink(row) : null;
  }

  /**
   * Returns up to `limit` links, newest first, starting after the position `after` (a `next`
   * value from an earlier page) or from the newest link when `after` is null.
   * @returns {{ links: object[], next: number | null }} `next` is null on the last page
   */
  list({ limit, after = null }) {
    const rows = after === null
      ? this.#statements.newest.all(limit + 1)
      : this.#statements.olderThan.all(after, limit + 1);
    const hasMore = rows.length > limit;
    if (hasMore) rows.length = limit;
    return { links: rows.map(toLink), next: hasMore ? rows.at(-1).id : null };
  }

  /**
   * Deletes the link and its clicks.
   * @returns whether there was a link to delete
   */
  delete(slug) {
    return this.#statements.deleteBySlug.run(slug).changes > 0;
  }

  /**
   * Counts a click on the link and records when it happened.
   * @returns the link's URL, or null if there is no link with this slug
   */
  recordClick(slug) {
    return this.#transaction(() => {
      const link = this.#statements.countClick.get(slug);
      if (!link) return null;
      this.#statements.insertClick.run(link.id, this.#now());
      return link.url;
    });
  }

  /**
   * @returns the total clicks and the clicks per UTC day for the last 7 days (oldest first),
   *   or null if there is no link with this slug
   */
  stats(slug) {
    const link = this.#statements.getBySlug.get(slug);
    if (!link) return null;

    const today = Math.floor(this.#now() / DAY_MS);
    const firstDay = today - (STATS_DAYS - 1);
    const clicksByDay = new Map();
    for (const { day, clicks } of this.#statements.clicksPerDay.all(link.id, firstDay * DAY_MS, (today + 1) * DAY_MS)) {
      clicksByDay.set(day, clicks);
    }

    const daily = [];
    for (let day = firstDay; day <= today; day++) {
      daily.push({ date: new Date(day * DAY_MS).toISOString().slice(0, 10), clicks: clicksByDay.get(day) ?? 0 });
    }
    return { slug: link.slug, clicks: link.clicks, daily };
  }

  #insert(url, slug) {
    const row = this.#statements.insert.get(slug, url, this.#now());
    return row ? toLink(row) : null;
  }

  #transaction(work) {
    this.#db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      this.#db.exec('COMMIT');
      return result;
    } catch (error) {
      if (this.#db.isTransaction) this.#db.exec('ROLLBACK');
      throw error;
    }
  }
}

function toLink(row) {
  return { slug: row.slug, url: row.url, createdAt: new Date(row.created_at).toISOString(), clicks: row.clicks };
}

function randomSlug() {
  let slug = '';
  for (let i = 0; i < GENERATED_SLUG_LENGTH; i++) slug += SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)];
  return slug;
}
