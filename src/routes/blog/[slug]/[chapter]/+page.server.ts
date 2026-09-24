import { error } from '@sveltejs/kit';
import { splitTitle } from '$lib/posts';
import { chaptersOf } from '$lib/server/books';
import { deleteComment, listComments, postComment } from '$lib/server/comments';
import { posts } from '$lib/server/posts';
import type { Actions, PageServerLoad } from './$types';

function find(params: { slug: string; chapter: string }) {
	const book = posts.find((post) => post.slug === params.slug);
	const chapters = chaptersOf(params.slug);
	const index = chapters.findIndex((chapter) => chapter.slug === params.chapter);
	if (!book || index < 0) error(404, 'There is no chapter here.');
	return { book, chapters, index, path: `/blog/${book.slug}/${chapters[index].slug}` };
}

// The book around a chapter: its front page, all its chapters, the ones either side, and the
// chapter's comments.
export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const { book, chapters, index, path } = find(params);
	return {
		book,
		chapters,
		chapter: chapters[index],
		number: index + 1,
		previous: chapters[index - 1],
		next: chapters[index + 1],
		comments: await listComments(platform?.env.DB, path),
		author: locals.author
	};
};

export const actions: Actions = {
	comment: (event) => {
		const { book, chapters, index, path } = find(event.params);
		const [bookTitle] = splitTitle(book.title);
		return postComment(event, { path, title: `${chapters[index].title} · ${bookTitle}` });
	},
	deleteComment
};
