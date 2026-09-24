import { error } from '@sveltejs/kit';
import { chaptersOf } from '$lib/server/books';
import { deleteComment, listComments, postComment } from '$lib/server/comments';
import { posts } from '$lib/server/posts';
import type { Actions, PageServerLoad } from './$types';

// Neighbours for the links at the end of a post, its chapters if it's a book, and its comments;
// the post itself loads in +page.ts.
export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const index = posts.findIndex((post) => post.slug === params.slug);
	return {
		newer: index > 0 ? posts[index - 1] : undefined,
		older: index >= 0 ? posts[index + 1] : undefined,
		chapters: chaptersOf(params.slug),
		comments: index >= 0 ? await listComments(platform?.env.DB, `/blog/${params.slug}`) : null,
		author: locals.author
	};
};

export const actions: Actions = {
	comment: (event) => {
		const post = posts.find((post) => post.slug === event.params.slug);
		if (!post) error(404, 'There is no post here.');
		return postComment(event, { path: `/blog/${post.slug}`, title: post.title });
	},
	deleteComment
};
