import type { Post } from '$lib/index'

export async function GET({ fetch }) {
	const response = await fetch('/api/posts')
	const posts: Post[] = await response.json()

	const headers = { 'Content-Type': 'application/xml' }

	const xml = `
		<rss xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
			<channel>
				<title>Em1t's blog</title>
				<description>Blog where I talk about tech, cybersecurity, maybe even CTFs.</description>
				<link>https://em1t.me/blog</link>
				<atom:link href="https://em1t.me/rss.xml" rel="self" type="application/rss+xml"/>
				${posts
					.map(
						(post) => `
						<item>
							<title>${post.title}</title>
							<description>${post.description}</description>
							<link>https://em1t.me/blog/${post.slug}</link>
							<guid isPermaLink="true">https://em1t.me/blog/${post.slug}</guid>
							<pubDate>${new Date(post.date).toUTCString()}</pubDate>
						</item>
					`
					)
					.join('')}
			</channel>
		</rss>
	`.trim()

	return new Response(xml, { headers })
}
