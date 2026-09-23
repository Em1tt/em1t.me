import { posts } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

// Neighbours for the links at the end of a post; the post itself loads in +page.ts.
export const load: PageServerLoad = ({ params }) => {
	const index = posts.findIndex((post) => post.slug === params.slug);
	return {
		newer: index > 0 ? posts[index - 1] : undefined,
		older: index >= 0 ? posts[index + 1] : undefined
	};
};
