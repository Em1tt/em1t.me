import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { endSession, SESSION_DAYS, startSession } from '$lib/server/author';
import { chapters } from '$lib/server/books';
import { deleteComment, recentComments } from '$lib/server/comments';
import { hmac, sameString } from '$lib/server/crypto';
import { posts } from '$lib/server/posts';
import { validateToken } from '$lib/server/turnstile';
import type { Actions, PageServerLoad } from './$types';

// Where each comment was left, by page path.
const titles: Record<string, string> = Object.fromEntries([
	...posts.map((post) => [`/blog/${post.slug}`, post.title]),
	...chapters.map((chapter) => [`/blog/${chapter.book}/${chapter.slug}`, chapter.title])
]);

// Signing in as the author, and the latest comments on every page once signed in.
export const load: PageServerLoad = async ({ locals, platform, setHeaders }) => {
	setHeaders({ 'x-robots-tag': 'noindex' });
	return {
		author: locals.author,
		days: SESSION_DAYS,
		recent: locals.author ? await recentComments(platform?.env.DB) : [],
		titles
	};
};

export const actions: Actions = {
	signIn: async ({ request, platform, cookies, getClientAddress }) => {
		const db = platform?.env.DB;
		if (!db || !env.ADMIN_PASSWORD || !env.TURNSTILE_SECRET || !env.IP_HASH_SECRET) {
			return fail(503, { error: "Signing in isn't set up here." });
		}
		const form = await request.formData();

		// 10 wrong passwords an hour from one address, then nothing gets checked.
		const ipHash = await hmac(env.IP_HASH_SECRET, getClientAddress());
		const failures = await db
			.prepare(
				`SELECT COUNT(*) AS count FROM sign_in_failures WHERE ip_hash = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 hour')`
			)
			.bind(ipHash)
			.first<number>('count');
		if ((failures ?? 0) >= 10) {
			return fail(429, { error: 'Too many wrong passwords. Try again in an hour.' });
		}

		const spamCheck = await validateToken(
			String(form.get('cf-turnstile-response') ?? ''),
			env.TURNSTILE_SECRET
		);
		if (!spamCheck.success) return fail(400, { error: "The spam check didn't pass. Try again." });

		if (!(await sameString(String(form.get('password') ?? ''), env.ADMIN_PASSWORD))) {
			await db.batch([
				db.prepare(
					`DELETE FROM sign_in_failures WHERE created_at <= strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 day')`
				),
				db.prepare('INSERT INTO sign_in_failures (ip_hash) VALUES (?)').bind(ipHash)
			]);
			return fail(400, { error: "That's not the password." });
		}

		await startSession(db, cookies);
		redirect(303, '/admin');
	},

	signOut: async ({ platform, cookies }) => {
		await endSession(platform?.env.DB, cookies);
		redirect(303, '/admin');
	},

	deleteComment
};
