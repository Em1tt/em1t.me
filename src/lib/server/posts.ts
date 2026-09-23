import type { PostMeta } from '$lib/posts';

// Server-only, so pages that list posts don't ship the posts' components to the browser.
const modules = import.meta.glob<Omit<PostMeta, 'slug'>>('/src/content/posts/*.svx', {
	eager: true,
	import: 'metadata'
});

export const posts: PostMeta[] = Object.entries(modules)
	.map(([path, metadata]) => ({ ...metadata, slug: path.split('/').at(-1)!.replace('.svx', '') }))
	.filter((post) => post.published)
	.sort((a, b) => b.date.localeCompare(a.date));

export const featuredPost = posts.find((post) => post.featured) ?? posts[0];
