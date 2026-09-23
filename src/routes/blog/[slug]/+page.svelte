<script lang="ts">
	import 'katex/dist/katex.min.css';
	import { resolve } from '$app/paths';
	import SectionLabel from '$lib/components/SectionLabel.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { formatDate, splitTitle } from '$lib/posts';
	import { SITE } from '$lib/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const [title, subtitle] = $derived(splitTitle(data.meta.title));
	const card = $derived(`/og/blog/${data.meta.slug}.jpg`);
	const structured = $derived({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: data.meta.title,
		description: data.meta.description,
		datePublished: data.meta.date,
		image: SITE.url + card,
		url: `${SITE.url}/blog/${data.meta.slug}`,
		author: { '@type': 'Person', name: SITE.author, url: SITE.url }
	});

	let article: HTMLElement;
	let sections = $state<{ id: string; text: string; sub: boolean }[]>([]);

	// Build the contents list from the rendered headings (rehype-slug gives them ids).
	$effect(() => {
		void data.Body;
		sections = [...article.querySelectorAll<HTMLElement>('h2[id], h3[id]')].map((heading) => ({
			id: heading.id,
			text: heading.textContent ?? '',
			sub: heading.tagName === 'H3'
		}));
	});
</script>

<Seo
	title="{data.meta.title} · em1t.me"
	heading={data.meta.title}
	description={data.meta.description}
	image={card}
	imageAlt="{data.meta.title}, a post by Richard Marcinčák"
	type="article"
	published={data.meta.date}
	jsonLd={structured}
/>

<div class="min-h-dvh bg-[#05030f] text-slate-200">
	<header
		class="relative flex min-h-[62dvh] flex-col items-start justify-end gap-3.5 bg-[url('/bg4.png')] bg-cover bg-center bg-no-repeat px-4 py-[clamp(24px,6vh,72px)] md:px-10 lg:px-20"
	>
		<a
			href={resolve('/blog')}
			class="google-sans-code-500 absolute top-[clamp(24px,6vh,72px)] left-4 bg-[#05030f] px-[0.75em] py-[0.6em] text-xs leading-none tracking-widest text-slate-300 uppercase hover:bg-[#a91a06] hover:text-white md:left-10 lg:left-20"
			>← Blog</a
		>
		<SectionLabel
			>{formatDate(data.meta.date)}{data.meta.status ? ` · ${data.meta.status}` : ''}</SectionLabel
		>
		<h1
			class="google-sans-500 mt-[0.1em] max-w-[18em] text-[clamp(36px,5vw,88px)] leading-[1.14] tracking-tight"
		>
			<span class="bg-[#05030f] box-decoration-clone px-[0.14em] pb-[0.04em]">{title}</span>
			{#if subtitle}
				<span class="bg-[#a91a06] box-decoration-clone px-[0.14em] pb-[0.04em] text-white"
					>{subtitle}</span
				>
			{/if}
		</h1>
		<p class="google-sans-400 max-w-[34em] text-[clamp(17px,1.35vw,23px)] leading-[1.85]">
			<span class="bg-[#05030f] box-decoration-clone px-[0.42em] py-[0.16em]"
				>{data.meta.description}</span
			>
		</p>
	</header>

	<div
		class="mx-auto grid max-w-7xl gap-[clamp(24px,4vw,72px)] px-4 py-[clamp(48px,8vh,96px)] md:px-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] lg:px-20"
	>
		<aside
			class="google-sans-code-400 grid content-start gap-6 self-start text-[13px] lg:sticky lg:top-8"
		>
			<dl
				class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 border-t border-slate-400/20 leading-normal"
			>
				<dt
					class="border-b border-slate-400/20 pt-[11px] pb-[9px] text-[11px] tracking-[0.08em] text-slate-400 uppercase"
				>
					Date
				</dt>
				<dd class="border-b border-slate-400/20 py-[9px] text-slate-300">
					<time datetime={data.meta.date}>{formatDate(data.meta.date)}</time>
				</dd>
				{#if data.meta.status}
					<dt
						class="border-b border-slate-400/20 pt-[11px] pb-[9px] text-[11px] tracking-[0.08em] text-slate-400 uppercase"
					>
						Status
					</dt>
					<dd class="border-b border-slate-400/20 py-[9px] text-[#ff5640]">{data.meta.status}</dd>
				{/if}
				<dt
					class="border-b border-slate-400/20 pt-[11px] pb-[9px] text-[11px] tracking-[0.08em] text-slate-400 uppercase"
				>
					Tags
				</dt>
				<dd class="border-b border-slate-400/20 py-[9px] text-slate-300">
					{data.meta.categories.join(', ')}
				</dd>
			</dl>
			{#if sections.length}
				<nav aria-label="Sections">
					<p class="mb-2 text-[11px] tracking-[0.08em] text-slate-400 uppercase">Sections</p>
					<ul class="grid gap-1.5">
						{#each sections as section (section.id)}
							<li class={section.sub ? 'pl-3' : ''}>
								<!-- eslint-disable svelte/no-navigation-without-resolve -- in-page heading anchors -->
								<a
									href="#{section.id}"
									class="leading-snug {section.sub
										? 'text-slate-500'
										: 'text-slate-300'} hover:text-[#ff5640]">{section.text}</a
								>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
							</li>
						{/each}
					</ul>
				</nav>
			{/if}
		</aside>
		<article bind:this={article} class="post-body min-w-0">
			<data.Body />
		</article>
	</div>

	<nav
		class="mx-auto grid max-w-7xl gap-6 border-t border-slate-400/20 px-4 pt-7 pb-14 md:grid-cols-2 md:px-10 lg:px-20"
		aria-label="More posts"
	>
		<div class="grid content-start gap-1">
			{#if data.older}
				<span class="google-sans-code-500 text-xs tracking-[0.08em] text-slate-400 uppercase"
					>Older</span
				>
				<a
					href={resolve('/blog/[slug]', { slug: data.older.slug })}
					class="google-sans-500 text-[clamp(20px,2vw,30px)] leading-tight tracking-[-0.015em] hover:text-[#ff5640]"
					>← {data.older.title}</a
				>
			{/if}
		</div>
		<div class="grid content-start gap-1 md:justify-items-end md:text-right">
			{#if data.newer}
				<span class="google-sans-code-500 text-xs tracking-[0.08em] text-slate-400 uppercase"
					>Newer</span
				>
				<a
					href={resolve('/blog/[slug]', { slug: data.newer.slug })}
					class="google-sans-500 text-[clamp(20px,2vw,30px)] leading-tight tracking-[-0.015em] hover:text-[#ff5640]"
					>{data.newer.title} →</a
				>
			{:else}
				<a
					href={resolve('/blog')}
					class="google-sans-code-500 text-xs tracking-[0.08em] text-[#ff5640] uppercase hover:text-white"
					>All posts →</a
				>
			{/if}
		</div>
	</nav>
</div>

<style>
	/* Post bodies come from src/content/posts/*.svx; style their markdown output here. */
	.post-body {
		font-family: 'Google Sans', sans-serif;
		color: #cbd5e1;
		font-size: clamp(17px, 1.2vw, 20px);
		line-height: 1.7;
	}
	.post-body :global(:where(p, ul, ol, blockquote, figure, pre, .katex-display)) {
		max-width: 40em;
		margin: 0 0 1.15em;
	}
	.post-body :global(h2) {
		margin: 2.4em 0 0.7em;
		scroll-margin-top: 2rem;
		font-family: 'Google Sans', sans-serif;
		font-weight: 500;
		font-size: clamp(26px, 2.2vw, 38px);
		line-height: 1.15;
		letter-spacing: -0.02em;
		color: #e2e8f0;
	}
	.post-body :global(h2:first-child) {
		margin-top: 0;
	}
	.post-body :global(h3) {
		margin: 1.9em 0 0.6em;
		scroll-margin-top: 2rem;
		font-family: 'Google Sans Code', monospace;
		font-weight: 500;
		font-size: 13px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #ff5640;
	}
	.post-body :global(a) {
		color: #e2e8f0;
		text-decoration: underline;
		text-decoration-color: #ff5640;
		text-underline-offset: 4px;
	}
	.post-body :global(strong) {
		font-weight: 700;
		color: #e2e8f0;
	}
	.post-body :global(ul) {
		list-style: disc;
		padding-left: 1.2em;
	}
	.post-body :global(ol) {
		list-style: decimal;
		padding-left: 1.4em;
	}
	.post-body :global(li) {
		margin-bottom: 0.4em;
	}
	.post-body :global(li::marker) {
		color: #ff5640;
	}
	.post-body :global(blockquote) {
		padding-left: 1.1em;
		border-left: 2px solid #a91a06;
		color: #94a3b8;
		font-style: italic;
	}
	.post-body :global(blockquote p) {
		margin-bottom: 0.6em;
	}
	.post-body :global(p > img) {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 1.8em 0;
		border: 1px solid rgb(148 163 184 / 0.2);
	}
	.post-body :global(:not(pre) > code) {
		padding: 0.1em 0.35em;
		background: #0c0a1a;
		border: 1px solid rgb(148 163 184 / 0.15);
		font-family: 'Google Sans Code', monospace;
		font-size: 0.86em;
		color: #ffa261;
		overflow-wrap: anywhere;
	}
	.post-body :global(figure.code) {
		border: 1px solid rgb(148 163 184 / 0.2);
		background: #0c0a1a;
	}
	.post-body :global(.code-file) {
		padding: 0.55em 0.9em;
		border-bottom: 1px solid rgb(148 163 184 / 0.2);
		font-family: 'Google Sans Code', monospace;
		font-size: 12px;
		letter-spacing: 0.04em;
		color: #94a3b8;
	}
	.post-body :global(pre) {
		margin: 0;
		max-width: none;
		padding: 1em 1.1em;
		overflow-x: auto;
		font-family: 'Google Sans Code', monospace;
		font-size: 14px;
		line-height: 1.6;
	}
	.post-body :global(.katex-display) {
		overflow-x: auto;
		overflow-y: hidden;
		padding-block: 0.3em;
		color: #e2e8f0;
	}
	.post-body :global(.katex) {
		font-size: 1.08em;
	}
	.post-body :global(figure.demo) {
		max-width: none;
		margin: 1.6em 0 2em;
	}
</style>
