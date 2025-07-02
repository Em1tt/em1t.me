import type { Post } from '$lib/index';

export async function GET() {
    // Get all posts
    const posts: Post[] = await Promise.all(
        Object.entries(import.meta.glob('/src/posts/*.{md,svx}'))
            .map(async ([path, resolver]) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { metadata } = await resolver() as any;
                const slug = path.split('/').at(-1)?.replace('.svx', '').replace('.md', '');
                return { ...metadata, slug };
            })
    ).then(posts => posts.filter(post => post.published));

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://em1t.me</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://em1t.me/blog</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    ${posts
        .map(
            (post) => `
    <url>
        <loc>https://em1t.me/blog/${post.slug}</loc>
        <lastmod>${new Date(post.date).toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`
        )
        .join('')}
</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}