import { caseStudies } from '$lib/projects';
import { chapters } from '$lib/server/books';
import { posts } from '$lib/server/posts';
import { SITE } from '$lib/site';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const pages: { path: string; lastmod?: string }[] = [
		{ path: '/' },
		{ path: '/blog', lastmod: posts[0]?.date },
		...caseStudies.map((project) => ({ path: `/work/${project.slug}` })),
		...posts.map((post) => ({ path: `/blog/${post.slug}`, lastmod: post.date })),
		...chapters.map((chapter) => ({ path: `/blog/${chapter.book}/${chapter.slug}` }))
	];

	const urls = pages
		.map(({ path, lastmod }) =>
			[
				'\t<url>',
				`\t\t<loc>${SITE.url}${path}</loc>`,
				...(lastmod ? [`\t\t<lastmod>${lastmod}</lastmod>`] : []),
				'\t</url>'
			].join('\n')
		)
		.join('\n');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
		{ headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } }
	);
};
