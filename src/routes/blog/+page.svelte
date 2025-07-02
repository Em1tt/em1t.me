<script lang="ts">
	import { formatDate } from '$lib/utils';
	import { ArrowLeft } from '@lucide/svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Blog | Richard Em1t - Web Development Articles & Tutorials</title>
	<meta
		name="description"
		content="Read web development articles, tutorials, and insights on modern technologies like SvelteKit, React, TypeScript, and best practices by Richard Em1t."
	/>
	<meta
		name="keywords"
		content="web development blog, SvelteKit tutorials, React guides, TypeScript tips, JavaScript articles, programming blog"
	/>

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Blog | Richard Em1t - Web Development Articles" />
	<meta
		property="og:description"
		content="Read web development articles, tutorials, and insights on modern technologies."
	/>
	<meta property="og:url" content="https://em1t.me/blog" />
	<meta property="og:image" content="https://em1t.me/blog-og-image.png" />
</svelte:head>

<div class="polka fixed top-0 left-0 -z-10 h-screen w-screen">
	<div id="radialGradient"></div>
	<div id="radialGradient2"></div>
</div>

<div class="fixed bottom-4 left-4 z-40 hidden 2xl:block">
	<p class="text ibm-plex-mono-regular-italic text-gray-400">// Finished reading?</p>
	<a href="/" class="ibm-plex-mono-regular text-4xl text-gray-200 hover:text-sky-400">GoBack()</a>
</div>

<a
	href="/"
	class="back-to-top fixed bottom-4 left-4 z-50 cursor-pointer rounded-md bg-slate-900 p-3 text-sky-500 shadow-lg transition-all duration-300 hover:bg-slate-800 hover:text-white hover:shadow-xl 2xl:hidden"
>
	<ArrowLeft />
</a>

<div class="px-20">
	<div class="mx-auto flex min-h-screen max-w-4xl flex-row justify-center space-x-8">
		<div class="mt-20">
			<!-- Featured Recent Post -->
			{#each data.posts.slice(0, 1) as post}
				<article
					class="featured-post group relative mb-12 overflow-hidden rounded-2xl border border-slate-600/30 bg-gradient-to-br from-slate-700/80 to-slate-900/90 p-8 transition-all duration-300 hover:border-sky-500/40 hover:shadow-2xl"
				>
					<div class="relative z-10">
						<div class="relative mb-4 inline-flex items-center">
							<span
								class="relative z-10 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white uppercase"
							>
								Latest Post
							</span>
							<div
								class="badge-glow absolute -inset-0.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-30"
							></div>
						</div>

						<h2 class="mb-4 text-3xl leading-tight font-bold">
							<a
								href="blog/{post.slug}"
								class="title-link text-slate-100 transition-all duration-300 hover:text-sky-500"
							>
								{post.title}
							</a>
						</h2>

						<time class="mb-4 block text-sm font-medium text-slate-400"
							>{formatDate(post.date)}</time
						>

						<p class="mb-6 text-lg leading-relaxed text-slate-300">{post.description}</p>

						<div class="mb-8 flex flex-wrap gap-2">
							{#each post.categories as category}
								<span
									class="rounded-md bg-slate-600/40 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors duration-200 hover:bg-slate-600/60 hover:text-white"
								>
									#{category}
								</span>
							{/each}
						</div>

						<div class="flex justify-end">
							<a
								href="blog/{post.slug}"
								class="inline-flex items-center gap-2 py-2 font-semibold text-sky-500 transition-all duration-200 hover:translate-x-1 hover:text-blue-500"
							>
								Read Article
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="m9 18 6-6-6-6" />
								</svg>
							</a>
						</div>
					</div>
				</article>
			{/each}

			<!-- Other Posts Grid -->
			{#if data.posts.length > 1}
				<section class="mb-8">
					<h2 class="mb-6 text-2xl font-semibold text-slate-200">More Posts</h2>
					<div class="grid gap-6 md:grid-cols-2">
						{#each data.posts.slice(1) as post}
							<article
								class="post-card group relative overflow-hidden rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 transition-all duration-300 hover:border-slate-600/60 hover:shadow-lg"
							>
								<div class="relative z-10">
									<h3 class="mb-3 text-xl leading-tight font-semibold">
										<a
											href="blog/{post.slug}"
											class="post-title-link text-slate-200 transition-colors duration-200 hover:text-sky-400"
										>
											{post.title}
										</a>
									</h3>

									<time class="mb-3 block text-sm text-slate-400">{formatDate(post.date)}</time>

									<p class="mb-4 leading-relaxed text-slate-300">{post.description}</p>

									<div class="mb-4 flex flex-wrap gap-2">
										{#each post.categories as category}
											<span
												class="rounded-md bg-slate-700/50 px-2 py-1 text-xs font-medium text-slate-300"
											>
												#{category}
											</span>
										{/each}
									</div>

									<div class="flex items-center justify-between">
										<a
											href="blog/{post.slug}"
											class="inline-flex items-center gap-1 text-sm font-medium text-sky-500 transition-all duration-200 hover:translate-x-1 hover:text-sky-400"
										>
											Read more
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<path d="m9 18 6-6-6-6" />
											</svg>
										</a>
									</div>
								</div>
							</article>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>

<style lang="postcss">
	@reference "../../app.css";

	.title-link {
		background: linear-gradient(90deg, #0ea5e9, #3b82f6);
		background-size: 0% 2px;
		background-repeat: no-repeat;
		background-position: left bottom;
		text-decoration: none;
	}

	.title-link:hover {
		background-size: 100% 2px;
	}

	.post-title-link {
		background: linear-gradient(90deg, #0ea5e9, #3b82f6);
		background-size: 0% 1px;
		background-repeat: no-repeat;
		background-position: left bottom;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.post-title-link:hover {
		background-size: 100% 1px;
	}

	:global(#sections) {
		display: none;
	}
	:global(#sections + ul) {
		display: none;
	}

	#radialGradient {
		z-index: 3;
		background-image: radial-gradient(
			ellipse 150% 100% at top center,
			rgba(233, 14, 80, 0.123) 0%,
			rgba(0, 0, 0, 0.089) 40%
		);
		position: absolute;
		pointer-events: none;
		width: 100vw;
		height: 100vh;
	}

	#radialGradient2 {
		z-index: 3;
		background-image: radial-gradient(
			ellipse 150% 100% at bottom center,
			rgba(14, 164, 233, 0.123) 0%,
			rgba(0, 0, 0, 0.089) 40%
		);
		position: absolute;
		pointer-events: none;
		width: 100vw;
		height: 100vh;
	}

	.polka {
		--dot-bg: oklch(0.129 0.042 264.695);
		--dot-color: #1d293d;
		--dot-size: 1px;
		--dot-space: 22px;
		background:
			linear-gradient(90deg, var(--dot-bg) calc(var(--dot-space) - var(--dot-size)), transparent 1%)
				center / var(--dot-space) var(--dot-space),
			linear-gradient(var(--dot-bg) calc(var(--dot-space) - var(--dot-size)), transparent 1%)
				center / var(--dot-space) var(--dot-space),
			var(--dot-color);
	}
</style>
