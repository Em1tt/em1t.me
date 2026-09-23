<script lang="ts">
	import { resolve } from '$app/paths';
	import SectionLabel from '$lib/components/SectionLabel.svelte';
	import { formatDate } from '$lib/posts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Blog · em1t.me</title>
	<meta
		name="description"
		content="Posts by Richard Marcinčák: the maths behind games, and CTF challenges with their intended solutions."
	/>
</svelte:head>

<div class="min-h-dvh bg-[#05030f] text-slate-200">
	<header
		class="relative flex min-h-[46dvh] flex-col items-start justify-end gap-3.5 bg-[url('/bg4.png')] bg-cover bg-center bg-no-repeat px-4 pt-28 pb-[clamp(24px,6vh,72px)] md:px-10 lg:px-20"
	>
		<a
			href="{resolve('/')}#blog"
			class="google-sans-code-500 absolute top-[clamp(24px,6vh,72px)] left-4 bg-[#05030f] px-[0.75em] py-[0.6em] text-xs leading-none tracking-widest text-slate-300 uppercase hover:bg-[#a91a06] hover:text-white md:left-10 lg:left-20"
			>← em1t.me</a
		>
		<SectionLabel>Blog</SectionLabel>
		<h1 class="google-sans-700 text-[clamp(56px,9vw,160px)] leading-[0.98] tracking-[-0.05em]">
			<span class="bg-[#05030f] box-decoration-clone px-[0.1em] pb-[0.04em]">Blog</span>
		</h1>
		<p class="google-sans-400 max-w-[30em] text-[clamp(17px,1.4vw,24px)] leading-[1.8]">
			<span class="bg-[#05030f] box-decoration-clone px-[0.42em] py-[0.16em]"
				>Things I worked out and wrote down: the maths behind games, and CTF challenges I wrote,
				with their solutions.</span
			>
		</p>
	</header>

	<ol class="mx-auto max-w-7xl px-4 py-[clamp(40px,7vh,88px)] md:px-10 lg:px-20">
		{#each data.posts as post (post.slug)}
			<li>
				<a
					href={resolve('/blog/[slug]', { slug: post.slug })}
					class="group grid gap-x-8 gap-y-2 border-t border-slate-400/20 py-7 md:grid-cols-[13ch_minmax(0,1fr)_auto]"
				>
					<time datetime={post.date} class="google-sans-code-400 pt-2 text-[13px] text-slate-400"
						>{formatDate(post.date)}</time
					>
					<span class="grid gap-2">
						<span
							class="google-sans-500 text-[clamp(24px,2.4vw,40px)] leading-[1.12] tracking-[-0.02em] text-balance group-hover:text-white"
							>{post.title}</span
						>
						<span class="google-sans-400 max-w-[42em] text-[17px] leading-relaxed text-slate-400"
							>{post.description}</span
						>
						<span class="google-sans-code-400 flex flex-wrap gap-1.5 pt-1 text-xs text-slate-500">
							{#each post.categories as category (category)}
								<span class="border border-slate-400/20 px-[0.6em] py-[0.35em]">{category}</span>
							{/each}
						</span>
					</span>
					<span class="google-sans-code-500 pt-2 text-xs tracking-[0.06em] text-[#ff5640] uppercase"
						>{post.status ?? ''}</span
					>
				</a>
			</li>
		{/each}
	</ol>
</div>
