// Comments on posts and book chapters, kept in D1 (migrations/). Anyone can comment, named or
// anonymously, past a Turnstile check and a rate limit; every new comment pings me on Discord.
// Signed in at /admin, I post as Em1t with no spam check, and can delete comments.
import { env } from '$env/dynamic/private';
import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import {
	AUTHOR_NAME,
	BODY_MAX,
	NAME_MAX,
	commenterName,
	type Comment,
	type CommentThread
} from '$lib/comments';
import { SITE } from '$lib/site';
import { hmac } from './crypto';
import { validateToken } from './turnstile';

/** My Discord user, mentioned on every new comment (the contact form mentions it too). */
const MENTION = '261465909321924609';

/** A page that takes comments: its path without a locale prefix, and its title. */
export type CommentPage = { path: string; title: string };

type Row = {
	id: number;
	parent_id: number | null;
	name: string | null;
	body: string;
	is_author: number;
	created_at: string;
};

const COLUMNS = 'id, parent_id, name, body, is_author, created_at';

const toComment = (row: Row): Comment => ({
	id: row.id,
	name: row.name,
	body: row.body,
	author: row.is_author === 1,
	created: row.created_at
});

/**
 * Every comment on a page, oldest first, with replies under the comment they answer. null when
 * the database can't be reached, so the post itself still renders.
 */
export async function listComments(db: D1Database | undefined, page: string) {
	if (!db) return null;
	try {
		const { results } = await db
			.prepare(`SELECT ${COLUMNS} FROM comments WHERE page = ? ORDER BY id LIMIT 1000`)
			.bind(page)
			.all<Row>();
		// Ids only grow, so a comment always comes before its replies.
		const threads = new Map<number, CommentThread>();
		for (const row of results) {
			if (row.parent_id === null) threads.set(row.id, { ...toComment(row), replies: [] });
			else threads.get(row.parent_id)?.replies.push(toComment(row));
		}
		return [...threads.values()];
	} catch (error) {
		console.error('Loading comments failed', error);
		return null;
	}
}

/** The latest comments on every page, newest first, for /admin. */
export async function recentComments(db: D1Database | undefined, limit = 50) {
	if (!db) return [];
	const { results } = await db
		.prepare(`SELECT ${COLUMNS}, page FROM comments ORDER BY id DESC LIMIT ?`)
		.bind(limit)
		.all<Row & { page: string }>();
	return results.map((row) => ({ ...toComment(row), page: row.page }));
}

// Latin letters with the accents European languages use, digits, spaces and . _ ' -
const NAME_CHARACTERS = /^[A-Za-z0-9À-ÖØ-öø-ſȘ-ț ._'-]+$/;

// Characters that pass for others once accents are gone, so 'Em1t', 'EMIT', 'E.m.l.t' and
// 'Ernit' all read as 'emit'.
const LOOKALIKES: Record<string, string> = {
	'0': 'o',
	'1': 'i',
	'3': 'e',
	'4': 'a',
	'5': 's',
	'7': 't',
	'8': 'b',
	'9': 'g',
	l: 'i',
	ı: 'i',
	ł: 'i',
	ŀ: 'i',
	đ: 'd',
	ð: 'd',
	ø: 'o',
	ŧ: 't',
	ħ: 'h',
	ĸ: 'k',
	ß: 'ss',
	æ: 'ae',
	œ: 'oe',
	þ: 'p'
};
const RESERVED = ['emit', 'marcincak'];

function looksReserved(name: string) {
	const skeleton = name
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/./g, (character) => LOOKALIKES[character] ?? character)
		.replace(/rn/g, 'm')
		.replace(/[^a-z]/g, '');
	return RESERVED.some((reserved) => skeleton.includes(reserved));
}

/** A commenter's name, tidied, or null for Anonymous; or why it can't be used. */
function checkName(raw: string): { name: string | null } | { error: string } {
	const name = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
	if (!name) return { name: null };
	if (name.length > NAME_MAX) return { error: `Keep the name to ${NAME_MAX} characters.` };
	if (!NAME_CHARACTERS.test(name) || !/[\p{L}\p{N}]/u.test(name)) {
		return { error: "Names can use letters, numbers, spaces and . _ ' - only." };
	}
	if (looksReserved(name)) {
		return {
			error:
				'That name is reserved for the author. Pick another, or leave it empty to post as Anonymous.'
		};
	}
	return { name };
}

// Control characters, and the ones that flip text direction, which can disguise what a comment says.
// eslint-disable-next-line no-control-regex -- removing them is the point
const HIDDEN = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F‎‏‪-‮⁦-⁩]/g;

const cleanBody = (raw: string) =>
	raw
		.replace(/\r\n?/g, '\n')
		.replace(HIDDEN, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

/** Escapes Discord markdown, so a comment shows the way it was typed. */
const plain = (text: string) => text.replace(/[\\`*_~|<>[\]()#-]/g, '\\$&');
const clip = (text: string, max: number) =>
	text.length > max ? `${text.slice(0, max - 1)}…` : text;

async function notify(
	page: CommentPage,
	comment: { id: number; name: string | null; body: string },
	parent: Row | null
) {
	if (!env.COMMENTS_WEBHOOK) return;
	const who = comment.name ?? 'Anonymous';
	const to = parent && (parent.is_author ? 'you' : commenterName(toComment(parent)));
	const link = `${SITE.url}${page.path}?reply=${comment.id}#comment-${comment.id}`;
	try {
		const response = await fetch(env.COMMENTS_WEBHOOK, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				username: 'em1t.me comments',
				avatar_url: `${SITE.url}/Bot.png`,
				content: `<@${MENTION}> **${plain(who)}** ${to ? `replied to ${plain(to)}` : 'commented'} on **${plain(page.title)}**`,
				allowed_mentions: { users: [MENTION] },
				embeds: [
					{
						author: { name: clip(who, 256) },
						title: clip(page.title, 256),
						url: link,
						description: clip(plain(comment.body), 4096),
						color: 0xff5640,
						fields: parent
							? [{ name: `In reply to ${to}`, value: clip(plain(parent.body), 1024) }]
							: [],
						footer: { text: 'Open the link to reply. Sign in at em1t.me/admin to reply as Em1t.' },
						timestamp: new Date().toISOString()
					}
				]
			})
		});
		if (!response.ok)
			console.error('Comment webhook failed', response.status, await response.text());
	} catch (error) {
		console.error('Comment webhook failed', error);
	}
}

/**
 * The ?/comment action: a new comment, or a reply when the form has `parent`. Goes back to the
 * page at the new comment, which also works without JavaScript.
 */
export async function postComment(event: RequestEvent, page: CommentPage) {
	const { request, platform, locals, url } = event;
	const db = platform?.env.DB;
	if (!db) return fail(503, { error: 'Comments are offline right now. Try again later.' });

	const form = await request.formData();
	const body = cleanBody(String(form.get('body') ?? ''));
	if (!body) return fail(400, { error: 'Write something first.' });
	if (body.length > BODY_MAX) {
		return fail(400, { error: `That's ${body.length} characters; keep it to ${BODY_MAX}.` });
	}

	let name: string | null = AUTHOR_NAME;
	let ipHash: string | null = null;
	if (!locals.author) {
		const checked = checkName(String(form.get('name') ?? ''));
		if ('error' in checked) return fail(400, { error: checked.error });
		name = checked.name;

		// Read at request time, so a missing .env can't break the build (see .env.example).
		if (!env.TURNSTILE_SECRET || !env.IP_HASH_SECRET) {
			return fail(503, { error: "Comments aren't connected yet. Try again later." });
		}
		const spamCheck = await validateToken(
			String(form.get('cf-turnstile-response') ?? ''),
			env.TURNSTILE_SECRET
		);
		if (!spamCheck.success) {
			return fail(400, {
				error: `The spam check didn't pass${spamCheck.error ? ` (${spamCheck.error})` : ''}. Try again.`
			});
		}

		// At most 5 comments in 10 minutes and 30 a day from one address.
		ipHash = await hmac(env.IP_HASH_SECRET, event.getClientAddress());
		const recent = await db
			.prepare(
				`SELECT COUNT(*) AS today,
					SUM(created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-10 minutes')) AS lately
				FROM comments
				WHERE ip_hash = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 day')`
			)
			.bind(ipHash)
			.first<{ today: number; lately: number | null }>();
		if ((recent?.lately ?? 0) >= 5 || (recent?.today ?? 0) >= 30) {
			return fail(429, {
				error: "That's a lot of comments at once. Give it a while, then try again."
			});
		}
	}

	// A reply to a reply joins the same thread, which keeps threads one level deep.
	let parent: Row | null = null;
	const parentId = Number(form.get('parent') || 0);
	if (!Number.isSafeInteger(parentId) || parentId < 0) {
		return fail(400, { error: "That reply doesn't point at a comment." });
	}
	if (parentId) {
		parent = await db
			.prepare(`SELECT ${COLUMNS} FROM comments WHERE id = ? AND page = ?`)
			.bind(parentId, page.path)
			.first<Row>();
		if (!parent) return fail(404, { error: 'The comment you replied to has been deleted.' });
	}

	const row = await db
		.prepare(
			'INSERT INTO comments (page, parent_id, name, body, is_author, ip_hash) VALUES (?, ?, ?, ?, ?, ?) RETURNING id'
		)
		.bind(
			page.path,
			parent ? (parent.parent_id ?? parent.id) : null,
			name,
			body,
			locals.author ? 1 : 0,
			ipHash
		)
		.first<{ id: number }>();
	if (!row) return fail(500, { error: "That didn't post. Try again." });

	// My own comments don't need a ping. The ping doesn't hold up the response.
	if (!locals.author) {
		const ping = notify(page, { id: row.id, name, body }, parent);
		if (platform?.ctx) platform.ctx.waitUntil(ping);
		else await ping;
	}

	redirect(303, `${url.pathname}#comment-${row.id}`);
}

/** The ?/deleteComment action, for me only: a comment, and its replies if it has any. */
export async function deleteComment({ request, platform, locals }: RequestEvent) {
	if (!locals.author) return fail(403, { error: 'Only the author can delete comments.' });
	const db = platform?.env.DB;
	if (!db) return fail(503, { error: 'Comments are offline right now. Try again later.' });
	const id = Number((await request.formData()).get('id'));
	if (!Number.isSafeInteger(id)) return fail(400, { error: 'Which comment?' });
	await db.prepare('DELETE FROM comments WHERE id = ?1 OR parent_id = ?1').bind(id).run();
	return { deleted: id };
}
