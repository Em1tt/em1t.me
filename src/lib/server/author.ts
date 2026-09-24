// Signing in as the author at /admin: a random token in an HttpOnly cookie, and only its hash in D1.
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { randomToken, sha256 } from './crypto';

const COOKIE = 'em1t_author';
export const SESSION_DAYS = 180;
const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ', 'now')";

/** Whether the request comes from me, signed in. Only requests that carry the cookie query D1. */
export async function isAuthor({ cookies, platform }: RequestEvent) {
	const token = cookies.get(COOKIE);
	const db = platform?.env.DB;
	if (!token || !db) return false;
	try {
		const session = await db
			.prepare(`SELECT 1 FROM sessions WHERE token_hash = ? AND expires_at > ${NOW}`)
			.bind(await sha256(token))
			.first();
		if (!session) cookies.delete(COOKIE, { path: '/' });
		return session !== null;
	} catch (error) {
		console.error('Checking the session failed', error);
		return false;
	}
}

export async function startSession(db: D1Database, cookies: Cookies) {
	const token = randomToken();
	const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000)
		.toISOString()
		.replace(/\.\d+Z$/, 'Z');
	await db.batch([
		db.prepare(`DELETE FROM sessions WHERE expires_at <= ${NOW}`),
		db
			.prepare('INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)')
			.bind(await sha256(token), expires)
	]);
	cookies.set(COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: SESSION_DAYS * 86_400
	});
}

export async function endSession(db: D1Database | undefined, cookies: Cookies) {
	const token = cookies.get(COOKIE);
	if (token && db) {
		await db
			.prepare('DELETE FROM sessions WHERE token_hash = ?')
			.bind(await sha256(token))
			.run();
	}
	cookies.delete(COOKIE, { path: '/' });
}
