import { error } from '@sveltejs/kit';
import { chaptersOf } from '$lib/server/books';
import { posts } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

// The book around a chapter: its front page, all its chapters, and the ones either side.
export const load: PageServerLoad = ({ params }) => {
	const book = posts.find((post) => post.slug === params.slug);
	const chapters = chaptersOf(params.slug);
	const index = chapters.findIndex((chapter) => chapter.slug === params.chapter);
	if (!book || index < 0) error(404, 'There is no chapter here.');

	return {
		book,
		chapters,
		chapter: chapters[index],
		number: index + 1,
		previous: chapters[index - 1],
		next: chapters[index + 1]
	};
};
