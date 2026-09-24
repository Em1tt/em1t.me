-- Comments on blog posts and book chapters. `page` is the post's path, e.g. '/blog/collision-detection'
-- or '/blog/collision-detection/circles'. Replies point at a top-level comment: one level deep.
CREATE TABLE comments (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	page TEXT NOT NULL,
	parent_id INTEGER REFERENCES comments (id) ON DELETE CASCADE,
	-- NULL for Anonymous.
	name TEXT,
	body TEXT NOT NULL,
	-- 1 only for comments posted while signed in at /admin.
	is_author INTEGER NOT NULL DEFAULT 0,
	-- HMAC of the commenter's IP address, for the rate limit. NULL for the author.
	ip_hash TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX comments_page ON comments (page, id);
CREATE INDEX comments_ip ON comments (ip_hash, created_at);

-- Signed-in sessions for /admin. Only a hash of each cookie's token is kept.
CREATE TABLE sessions (
	token_hash TEXT PRIMARY KEY,
	expires_at TEXT NOT NULL
);

-- Wrong passwords at /admin, to slow down guessing.
CREATE TABLE sign_in_failures (
	ip_hash TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX sign_in_failures_ip ON sign_in_failures (ip_hash, created_at);
