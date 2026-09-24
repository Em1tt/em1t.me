<!--
	A book's table of contents: the full list on its front page, or the compact list beside a
	chapter with the current one marked.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { partLabel, type ChapterMeta } from '$lib/posts';

	type Props = {
		chapters: ChapterMeta[];
		/** The chapter being read, in the compact list. */
		current?: string;
		/** A part that isn't written yet, shown greyed at the end. */
		coming?: string;
		compact?: boolean;
	};

	let { chapters, current, coming, compact = false }: Props = $props();

	const parts = $derived([...new Set(chapters.map((chapter) => chapter.part))]);
	const numbered = $derived(chapters.map((chapter, i) => ({ ...chapter, number: i + 1 })));
	const href = (chapter: ChapterMeta) =>
		resolve('/blog/[slug]/[chapter]', { slug: chapter.book, chapter: chapter.slug });
</script>

{#if compact}
	<nav aria-label="Chapters">
		<p class="mb-2 text-[11px] tracking-[0.08em] text-slate-400 uppercase">Chapters</p>
		{#each parts as part (part)}
			<p class="mt-3 mb-1.5 text-[11px] tracking-[0.06em] text-slate-500">
				{partLabel(parts, part)}
			</p>
			<ol class="grid gap-1.5">
				{#each numbered.filter((chapter) => chapter.part === part) as chapter (chapter.slug)}
					<li class="grid grid-cols-[2ch_minmax(0,1fr)] gap-2">
						<span class="text-slate-500">{chapter.number}</span>
						<a
							href={href(chapter)}
							aria-current={chapter.slug === current ? 'page' : undefined}
							class="leading-snug {chapter.slug === current
								? 'text-[#ff5640]'
								: 'text-slate-300 hover:text-[#ff5640]'}">{chapter.title}</a
						>
					</li>
				{/each}
			</ol>
		{/each}
		{#if coming}<p class="mt-3 text-[11px] tracking-[0.06em] text-slate-500">{coming}</p>{/if}
	</nav>
{:else}
	<section class="book-contents" aria-labelledby="contents">
		<h2 id="contents">Contents</h2>
		{#each parts as part (part)}
			<h3>{partLabel(parts, part)}</h3>
			<ol>
				{#each numbered.filter((chapter) => chapter.part === part) as chapter (chapter.slug)}
					<li>
						<a href={href(chapter)}>
							<span class="number">{String(chapter.number).padStart(2, '0')}</span>
							<span class="title">{chapter.title}</span>
							<span class="description">{chapter.description}</span>
						</a>
					</li>
				{/each}
			</ol>
		{/each}
		{#if coming}<p class="coming">{coming}</p>{/if}
		{#if chapters[0]}
			<a class="start" href={href(chapters[0])}>Start reading: {chapters[0].title} →</a>
		{/if}
	</section>
{/if}

<style>
	.book-contents {
		margin-top: 2.6em;
	}
	.book-contents ol {
		max-width: 40em;
		margin: 0 0 1.4em;
		padding: 0;
		list-style: none;
		border-top: 1px solid rgb(148 163 184 / 0.2);
	}
	.book-contents li {
		margin: 0;
	}
	.book-contents li a {
		display: grid;
		grid-template-columns: 3.2ch minmax(0, 1fr);
		column-gap: 1em;
		padding: 0.75em 0;
		border-bottom: 1px solid rgb(148 163 184 / 0.2);
		text-decoration: none;
		color: inherit;
	}
	.number {
		grid-row: span 2;
		padding-top: 0.2em;
		font-family: 'Google Sans Code', monospace;
		font-size: 13px;
		color: #64748b;
	}
	.title {
		font-weight: 500;
		font-size: 1.08em;
		color: #e2e8f0;
		transition: color 0.15s;
	}
	.description {
		font-size: 0.88em;
		line-height: 1.55;
		color: #94a3b8;
	}
	.book-contents li a:hover .title,
	.book-contents li a:focus-visible .title {
		color: #ff5640;
	}
	.coming {
		font-family: 'Google Sans Code', monospace;
		font-size: 13px;
		color: #64748b;
	}
	.start {
		display: inline-block;
		margin-top: 0.4em;
		padding: 0.62em 1em;
		background: #a91a06;
		font-weight: 500;
		color: #fff;
		text-decoration: none;
	}
	.start:hover {
		background: #ff5640;
		color: #05030f;
	}
</style>
