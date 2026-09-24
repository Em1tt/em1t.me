<script lang="ts">
	import 'katex/dist/katex.min.css';
	import '../../post.css';
	import { resolve } from '$app/paths';
	import BookContents from '$lib/components/BookContents.svelte';
	import Comments from '$lib/components/Comments.svelte';
	import SectionLabel from '$lib/components/SectionLabel.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { copyCode } from '$lib/copyCode';
	import { partLabel, splitTitle } from '$lib/posts';
	import { SITE } from '$lib/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The book's name without its '(…)' tail, for the tab title and the way back.
	const [bookTitle] = $derived(splitTitle(data.book.title));
	const parts = $derived([...new Set(data.chapters.map((chapter) => chapter.part))]);
	const card = $derived(`/og/blog/${data.book.slug}.jpg`);
	const url = $derived(`${SITE.url}/blog/${data.book.slug}/${data.chapter.slug}`);
	const structured = $derived({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: `${data.chapter.title}: ${bookTitle}`,
		description: data.chapter.description,
		datePublished: data.book.date,
		image: SITE.url + card,
		url,
		author: { '@type': 'Person', name: SITE.author, url: SITE.url },
		isPartOf: {
			'@type': 'BlogPosting',
			headline: data.book.title,
			url: `${SITE.url}/blog/${data.book.slug}`
		}
	});
	const chapterHref = (slug: string) =>
		resolve('/blog/[slug]/[chapter]', { slug: data.book.slug, chapter: slug });

	let article: HTMLElement;
	let sections = $state<{ id: string; text: string }[]>([]);

	$effect(() => {
		void data.Body;
		sections = [...article.querySelectorAll<HTMLElement>('h2[id]')].map((heading) => ({
			id: heading.id,
			text: heading.textContent ?? ''
		}));
	});
</script>

<Seo
	title="{data.chapter.title} · {bookTitle}"
	heading="{data.chapter.title} · {bookTitle}"
	description={data.chapter.description}
	image={card}
	imageAlt="{data.book.title}, a post by Richard Marcinčák"
	type="article"
	published={data.book.date}
	jsonLd={structured}
/>

<div class="min-h-dvh bg-[#05030f] text-slate-200">
	<header
		class="relative flex min-h-[46dvh] flex-col items-start justify-end gap-3.5 bg-[url('/bg4.png')] bg-cover bg-center bg-no-repeat px-4 pt-28 pb-[clamp(24px,6vh,72px)] md:px-10 lg:px-20"
	>
		<a
			href={resolve('/blog/[slug]', { slug: data.book.slug })}
			class="google-sans-code-500 absolute top-[clamp(24px,6vh,72px)] left-4 max-w-[calc(100%-2rem)] truncate bg-[#05030f] px-[0.75em] py-[0.6em] text-xs leading-none tracking-widest text-slate-300 uppercase hover:bg-[#a91a06] hover:text-white md:left-10 lg:left-20"
			>← {bookTitle}</a
		>
		<SectionLabel>Chapter {data.number} · {partLabel(parts, data.chapter.part)}</SectionLabel>
		<h1
			class="google-sans-500 mt-[0.1em] max-w-[18em] text-[clamp(36px,5vw,88px)] leading-[1.14] tracking-tight"
		>
			<span class="bg-[#05030f] box-decoration-clone px-[0.14em] pb-[0.04em]"
				>{data.chapter.title}</span
			>
		</h1>
		<p class="google-sans-400 max-w-[34em] text-[clamp(17px,1.35vw,23px)] leading-[1.85]">
			<span class="bg-[#05030f] box-decoration-clone px-[0.42em] py-[0.16em]"
				>{data.chapter.description}</span
			>
		</p>
	</header>

	<div
		class="mx-auto grid max-w-7xl gap-[clamp(24px,4vw,72px)] px-4 py-[clamp(48px,8vh,96px)] md:px-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] lg:px-20"
	>
		<!-- On phones the way around is the link back to the contents and the links at the end. -->
		<aside
			class="google-sans-code-400 hidden content-start gap-7 self-start text-[13px] lg:sticky lg:top-8 lg:grid"
		>
			<BookContents
				chapters={data.chapters}
				current={data.chapter.slug}
				coming={data.book.coming}
				compact
			/>
			{#if sections.length}
				<nav aria-label="Sections">
					<p class="mb-2 text-[11px] tracking-[0.08em] text-slate-400 uppercase">On this page</p>
					<ul class="grid gap-1.5">
						{#each sections as section (section.id)}
							<li>
								<!-- eslint-disable svelte/no-navigation-without-resolve -- in-page heading anchors -->
								<a href="#{section.id}" class="leading-snug text-slate-300 hover:text-[#ff5640]"
									>{section.text}</a
								>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
							</li>
						{/each}
						<li>
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- in-page anchor -->
							<a href="#comments" class="leading-snug text-slate-300 hover:text-[#ff5640]"
								>Comments</a
							>
						</li>
					</ul>
				</nav>
			{/if}
		</aside>
		<div class="min-w-0">
			<article bind:this={article} class="post-body" {@attach copyCode}>
				<data.Body />
			</article>
			{#key `${data.book.slug}/${data.chapter.slug}`}
				<Comments comments={data.comments} author={data.author} />
			{/key}
		</div>
	</div>

	<nav
		class="mx-auto grid max-w-7xl gap-6 border-t border-slate-400/20 px-4 pt-7 pb-14 md:grid-cols-2 md:px-10 lg:px-20"
		aria-label="Chapters"
	>
		<div class="grid content-start gap-1">
			<span class="google-sans-code-500 text-xs tracking-[0.08em] text-slate-400 uppercase"
				>{data.previous ? 'Previous chapter' : 'Contents'}</span
			>
			{#if data.previous}
				<a
					href={chapterHref(data.previous.slug)}
					class="google-sans-500 text-[clamp(20px,2vw,30px)] leading-tight tracking-[-0.015em] hover:text-[#ff5640]"
					>← {data.previous.title}</a
				>
			{:else}
				<a
					href="{resolve('/blog/[slug]', { slug: data.book.slug })}#contents"
					class="google-sans-500 text-[clamp(20px,2vw,30px)] leading-tight tracking-[-0.015em] hover:text-[#ff5640]"
					>← Introduction and contents</a
				>
			{/if}
		</div>
		<div class="grid content-start gap-1 md:justify-items-end md:text-right">
			<span class="google-sans-code-500 text-xs tracking-[0.08em] text-slate-400 uppercase"
				>{data.next ? 'Next chapter' : 'Contents'}</span
			>
			{#if data.next}
				<a
					href={chapterHref(data.next.slug)}
					class="google-sans-500 text-[clamp(20px,2vw,30px)] leading-tight tracking-[-0.015em] hover:text-[#ff5640]"
					>{data.next.title} →</a
				>
			{:else}
				<a
					href="{resolve('/blog/[slug]', { slug: data.book.slug })}#contents"
					class="google-sans-500 text-[clamp(20px,2vw,30px)] leading-tight tracking-[-0.015em] hover:text-[#ff5640]"
					>Back to the contents →</a
				>
			{/if}
		</div>
	</nav>
</div>
