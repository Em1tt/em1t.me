import type { ChapterMeta } from '$lib/posts';

// Chapter frontmatter only; the chapters' components load per page (see blog/[slug]/[chapter]).
const modules = import.meta.glob<Omit<ChapterMeta, 'book' | 'slug'>>('/src/content/posts/*/*.svx', {
	eager: true,
	import: 'metadata'
});

export const chapters: ChapterMeta[] = Object.entries(modules)
	.map(([path, metadata]) => {
		const [, book, slug] = path.match(/posts\/([^/]+)\/([^/]+)\.svx$/)!;
		return { ...metadata, book, slug };
	})
	.filter((chapter) => chapter.published)
	.sort((a, b) => a.order - b.order);

export const chaptersOf = (book: string) => chapters.filter((chapter) => chapter.book === book);
