import { DISCORD_WEBHOOK, TURNSTILE_SECRET } from '$env/static/private';
import { validateToken } from '$lib';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	contact: async ({ request }) => {
		return fail(400, {
			error: "This is an old version of the website, please use the new one located on /",
		})
	}
};

import type { Post } from '$lib/index'

export async function load({ fetch }) {
	const response = await fetch('/api/posts')
	const posts: Post[] = await response.json()
	return { posts }
}