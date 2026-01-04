<script lang="ts">
	import { formatDate } from '$lib/utils';
	import Square from '$lib/components/Square.svelte';
	import GlowText from '$lib/components/GlowText.svelte';
	import Sparkles from '$lib/icons/Sparkles.svelte';
	import { ArrowLeft } from '@lucide/svelte';
	import FolderOpen from '$lib/icons/FolderOpen.svelte';

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

<section class="min-h-screen px-4 py-20 sm:px-6">
	<div class="mx-auto max-w-7xl">
		<!-- Section Header -->
		<div class="mb-12 flex flex-col items-center text-center">
			<Square>
				<FolderOpen />
			</Square>
			<h1 class="stack-sans-text mt-6 text-3xl text-stone-200 sm:text-4xl lg:text-5xl">
				My <GlowText>Blog</GlowText>
			</h1>
			<p class="mt-3 max-w-lg text-sm text-stone-500 sm:text-base">
				Thoughts, tutorials, and insights on web development and beyond
			</p>
		</div>

		{#if data.posts && data.posts.length > 0}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<!-- Featured Post (Latest) -->
				<a
					href="/blog/{data.posts[0].slug}"
					class="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-stone-900/95 via-stone-900/90 to-stone-950/95 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/5 md:col-span-2 lg:col-span-2 lg:row-span-2 sm:p-8"
					style="--accent1: {data.posts[0].accent1 || 'rgba(249, 115, 22, 0.15)'}; --accent2: {data.posts[0].accent2 || 'rgba(249, 115, 22, 0.1)'};"
				>
					<!-- Gradient accent background -->
					<div
						class="pointer-events-none absolute inset-0 opacity-50"
						style="background: radial-gradient(ellipse at top left, var(--accent1) 0%, transparent 50%), radial-gradient(ellipse at bottom right, var(--accent2) 0%, transparent 50%);"
					></div>

					<div class="relative z-10 flex h-full flex-col">
						<div class="mb-4 flex items-center gap-3">
							<span
								class="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-400 sm:text-xs"
							>
								Latest
							</span>
							<span class="text-xs text-stone-500 sm:text-sm">
								{formatDate(data.posts[0].date)}
							</span>
						</div>

						<h2
							class="stack-sans-text mb-4 text-2xl font-semibold text-stone-100 transition-colors group-hover:text-orange-400 sm:text-3xl lg:text-4xl"
						>
							{data.posts[0].title}
						</h2>

						<p class="mb-6 flex-grow text-sm leading-relaxed text-stone-400 sm:text-base lg:text-lg">
							{data.posts[0].description}
						</p>

						<div class="mt-auto flex flex-wrap gap-2">
							{#each data.posts[0].categories.slice(0, 4) as category}
								<span
									class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-1 text-xs text-stone-400 sm:px-3 sm:text-sm"
								>
									{category}
								</span>
							{/each}
						</div>

						<div
							class="mt-6 flex items-center gap-2 text-sm font-medium text-orange-400 transition-transform group-hover:translate-x-1 sm:text-base"
						>
							Read article
							<svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 8l4 4m0 0l-4 4m4-4H3"
								/>
							</svg>
						</div>
					</div>
				</a>

				<!-- Additional Posts -->
				{#each data.posts.slice(1) as post, index}
					<a
						href="/blog/{post.slug}"
						class="group relative rounded-xl border border-stone-800/80 bg-gradient-to-br from-stone-900/70 to-stone-900/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg sm:p-6"
						style="--accent1: {post.accent1 || 'rgba(249, 115, 22, 0.1)'}; --accent2: {post.accent2 || 'rgba(249, 115, 22, 0.05)'};"
					>
						<!-- Subtle gradient accent -->
						<div
							class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-30"
							style="background: radial-gradient(ellipse at top left, var(--accent1) 0%, transparent 60%);"
						></div>

						<div class="relative z-10">
							<div class="mb-3 text-xs text-stone-500">
								{formatDate(post.date)}
							</div>

							<h3
								class="stack-sans-text mb-3 text-lg font-semibold text-stone-200 transition-colors group-hover:text-orange-400 sm:text-xl"
							>
								{post.title}
							</h3>

							<p class="mb-4 line-clamp-2 text-sm leading-relaxed text-stone-400">
								{post.description}
							</p>

							<div class="flex flex-wrap gap-1.5">
								{#each post.categories.slice(0, 3) as category}
									<span
										class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-0.5 text-[10px] text-stone-500 sm:text-xs"
									>
										{category}
									</span>
								{/each}
							</div>

							<div
								class="mt-4 flex items-center gap-1 text-sm font-medium text-orange-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
							>
								Read more
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 8l4 4m0 0l-4 4m4-4H3"
									/>
								</svg>
							</div>
						</div>
					</a>
				{/each}

				<!-- Skeleton placeholders for future posts -->
				{#each Array(Math.max(0, 6 - data.posts.length)) as _, i}
					<div
						class="relative rounded-xl border border-stone-800/50 border-dashed bg-gradient-to-br from-stone-900/30 to-stone-900/20 p-5 sm:p-6"
					>
						<div class="animate-pulse">
							<div class="mb-3 h-3 w-20 rounded bg-stone-800/50"></div>
							<div class="mb-3 h-6 w-3/4 rounded bg-stone-800/50"></div>
							<div class="mb-2 h-4 w-full rounded bg-stone-800/30"></div>
							<div class="mb-4 h-4 w-2/3 rounded bg-stone-800/30"></div>
							<div class="flex gap-1.5">
								<div class="h-5 w-12 rounded-md bg-stone-800/40"></div>
								<div class="h-5 w-16 rounded-md bg-stone-800/40"></div>
							</div>
						</div>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-xs text-stone-600 font-medium">Coming soon</span>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Empty State -->
			<div
				class="flex flex-col items-center justify-center rounded-2xl border border-stone-800/50 bg-stone-900/30 py-16 text-center"
			>
				<div class="mb-4 text-4xl">📝</div>
				<h3 class="stack-sans-text mb-2 text-lg font-semibold text-stone-300">No posts yet</h3>
				<p class="text-sm text-stone-500">Check back soon for new content!</p>
			</div>
		{/if}
	</div>
</section>

<style lang="postcss">
	@reference "../../app.css";

	:global(#sections) {
		display: none;
	}
	:global(#sections + ul) {
		display: none;
	}
</style>
