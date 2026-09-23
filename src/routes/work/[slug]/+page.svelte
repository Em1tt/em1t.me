<script lang="ts">
	import { resolve } from '$app/paths';
	import SectionLabel from '$lib/components/SectionLabel.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// A missing fact shows as TK ("to come"), except the link: not everything has one to come.
	const facts = $derived(
		[
			['Type', data.project.type],
			['Role', data.project.facts?.role],
			['Year', data.project.facts?.year],
			['Stack', data.project.facts?.stack],
			['Team', data.project.facts?.team],
			['Link', data.project.facts?.link]
		].filter(([label, value]) => label !== 'Link' || value)
	);
</script>

<Seo
	title="{data.project.name} case study · em1t.me"
	heading="{data.project.name} case study"
	description={data.project.summary}
	image="/og/work/{data.project.slug}.jpg"
	imageAlt="{data.project.name} logo on its case study card"
	type="article"
/>

<div class="min-h-dvh bg-[#05030f] text-slate-200">
	<header
		class="relative grid min-h-[78dvh] content-end gap-10 overflow-hidden bg-[#0c0a1a] px-4 pt-28 pb-[clamp(24px,6vh,72px)] md:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16 lg:px-20"
		style:background-image={data.project.brand
			? `radial-gradient(ellipse 42% 55% at 74% 50%, ${data.project.brand}29, transparent 72%)`
			: undefined}
	>
		<a
			href="{resolve('/')}#work"
			class="google-sans-code-500 absolute top-[clamp(24px,6vh,72px)] left-4 bg-[#05030f] px-[0.75em] py-[0.6em] text-xs leading-none tracking-widest text-slate-300 uppercase hover:bg-[#a91a06] hover:text-white md:left-10 lg:left-20"
			>← em1t.me</a
		>
		{#if data.project.logo}
			<img
				src={data.project.logo}
				alt="{data.project.name} logo"
				class="max-h-28 w-auto max-w-[70%] md:max-h-40 lg:order-2 lg:max-h-[min(22rem,40dvh)] lg:max-w-[34rem] lg:justify-self-center"
			/>
		{/if}
		<div class="flex flex-col items-start gap-3.5 self-end lg:order-1">
			<SectionLabel>Case study · {data.position} of {data.total}</SectionLabel>
			<h1
				class="google-sans-700 mt-[0.1em] text-[clamp(56px,8vw,150px)] leading-[0.98] tracking-[-0.05em]"
			>
				<span class="bg-[#05030f] box-decoration-clone px-[0.1em] pb-[0.04em]"
					>{data.project.name}</span
				>
			</h1>
			<p class="google-sans-400 max-w-[30em] text-[clamp(18px,1.6vw,27px)] leading-[1.75]">
				<span class="bg-[#05030f] box-decoration-clone px-[0.42em] py-[0.16em]"
					>{data.project.summary}</span
				>
			</p>
		</div>
	</header>

	<div
		class="mx-auto grid max-w-7xl gap-[clamp(24px,4vw,72px)] px-4 py-[clamp(48px,8vh,96px)] md:px-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] lg:px-20"
	>
		<dl
			class="google-sans-code-400 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 self-start border-t border-slate-400/20 text-[13px] leading-normal lg:sticky lg:top-8"
		>
			{#each facts as [label, value] (label)}
				<dt
					class="border-b border-slate-400/20 pt-[11px] pb-[9px] text-[11px] tracking-[0.08em] text-slate-400 uppercase"
				>
					{label}
				</dt>
				<dd class="border-b border-slate-400/20 py-[9px] text-slate-300">
					{#if value?.startsWith('https://')}
						<!-- eslint-disable svelte/no-navigation-without-resolve -- external repository link -->
						<a
							href={value}
							class="underline decoration-slate-600 underline-offset-4 hover:text-white hover:decoration-[#ff5640]"
							>{value.replace('https://', '')}</a
						>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{:else if value}{value}{:else}<span class="tk">TK</span>{/if}
				</dd>
			{/each}
		</dl>
		<article class="case-body">
			<data.Body />
		</article>
	</div>

	<nav
		class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-slate-400/20 px-4 pt-7 pb-14 md:px-10 lg:px-20"
		aria-label="Next case study"
	>
		<span class="google-sans-code-500 text-xs tracking-[0.08em] text-slate-400 uppercase"
			>Next case study</span
		>
		<a
			href={resolve('/work/[slug]', { slug: data.next.slug })}
			class="google-sans-500 text-[clamp(28px,3vw,52px)] tracking-[-0.025em] hover:text-[#ff5640]"
			>{data.next.name} <span aria-hidden="true">→</span></a
		>
	</nav>
</div>

<style>
	/* The case study body comes from src/content/work/*.svx, so style its markdown output here. */
	.case-body :global(p) {
		max-width: 36em;
		margin: 0 0 1.1em;
		font-family: 'Google Sans', sans-serif;
		font-size: clamp(17px, 1.2vw, 20px);
		line-height: 1.68;
		color: #cbd5e1;
	}
	.case-body > :global(p:first-child) {
		max-width: 26em;
		margin-bottom: 1.4em;
		font-size: clamp(22px, 2vw, 34px);
		line-height: 1.32;
		letter-spacing: -0.012em;
		color: #e2e8f0;
	}
	.case-body :global(h2) {
		margin: 2.6em 0 0.9em;
		font-family: 'Google Sans Code', monospace;
		font-weight: 500;
		font-size: 12px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #ff5640;
	}
	.case-body :global(figure) {
		margin: 2.2em 0;
	}
	.case-body :global(p > img) {
		display: block;
		width: 100%;
		height: auto;
		margin: 2.2em 0;
		border: 1px solid rgb(148 163 184 / 0.2);
	}
	.case-body :global(code) {
		font-family: 'Google Sans Code', monospace;
		font-size: 0.88em;
		color: #ffa261;
	}
	.case-body :global(a) {
		text-decoration: underline;
		text-decoration-color: #ff5640;
		text-underline-offset: 4px;
	}
	.case-body :global(strong) {
		font-weight: 700;
		color: #e2e8f0;
	}
	.case-body :global(ul),
	.case-body :global(ol) {
		max-width: 36em;
		margin: 0 0 1.1em;
		padding-left: 1.2em;
		list-style: disc;
		color: #cbd5e1;
	}
</style>
