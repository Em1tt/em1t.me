<script lang="ts">
	import { resolve } from '$app/paths';
	import CollisionPlayground from '$lib/components/CollisionPlayground.svelte';
	import SectionLabel from '$lib/components/SectionLabel.svelte';
	import { formatDate, splitTitle, type PostMeta } from '$lib/posts';

	// The playground belongs to the collision-detection post, which is `featured` in its frontmatter.
	let { post, more = [] }: { post: PostMeta; more?: PostMeta[] } = $props();

	const [title, subtitle] = $derived(splitTitle(post.title));
</script>

<section
	id="blog"
	class="relative isolate min-h-dvh w-full snap-start overflow-hidden bg-[#05030f] px-4 text-slate-200 md:px-10 lg:px-20"
>
	<CollisionPlayground />
	<div
		class="pointer-events-none relative z-1 mx-auto grid min-h-dvh w-full max-w-7xl grid-rows-[auto_minmax(0,1fr)_auto] gap-5 py-[clamp(24px,6vh,72px)]"
	>
		<SectionLabel>Blog</SectionLabel>
		<div class="flex max-w-[52rem] flex-col items-start gap-3.5 self-center">
			<p class="google-sans-code-400 text-[13px] text-slate-400">
				<span class="inline-block bg-[#05030f] px-[0.7em] py-[0.55em]"
					><time datetime={post.date}>{formatDate(post.date)}</time>{#if post.status}
						· <b class="google-sans-code-500 text-[#ff5640]">{post.status}</b>{/if}</span
				>
			</p>
			<h2 class="google-sans-500 text-[clamp(34px,4vw,72px)] leading-[1.16] tracking-tight">
				<span class="bg-[#05030f] box-decoration-clone px-[0.14em] pb-[0.04em]">{title}</span>
				{#if subtitle}
					<span class="bg-[#a91a06] box-decoration-clone px-[0.14em] pb-[0.04em] text-white"
						>{subtitle}</span
					>
				{/if}
			</h2>
			<p class="google-sans-400 max-w-[30em] text-[clamp(16px,1.25vw,20px)] leading-[1.9]">
				<span class="bg-[#05030f] box-decoration-clone px-[0.42em] py-[0.16em]"
					>{post.description} Try it: drag either circle.</span
				>
			</p>
			<a
				href={resolve('/blog/[slug]', { slug: post.slug })}
				class="google-sans-500 pointer-events-auto bg-[#a91a06] px-[1em] py-[0.62em] text-[clamp(15px,1.05vw,18px)] text-white transition-colors hover:bg-[#ff5640] hover:text-[#05030f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5640] motion-reduce:transition-none"
			>
				Read the post <span aria-hidden="true">→</span>
			</a>
		</div>
		<nav
			class="google-sans-code-400 pointer-events-auto grid justify-items-start gap-1.5 self-end text-[13px] leading-none md:justify-items-end md:justify-self-end"
			aria-label="More posts"
		>
			{#each more as other (other.slug)}
				<a
					href={resolve('/blog/[slug]', { slug: other.slug })}
					class="bg-[#05030f] px-[0.75em] py-[0.65em] text-slate-300 hover:bg-[#a91a06] hover:text-white"
					>{other.title}</a
				>
			{/each}
			<a
				href={resolve('/blog')}
				class="bg-[#05030f] px-[0.75em] py-[0.65em] text-[#ff5640] hover:bg-[#a91a06] hover:text-white"
				>All posts →</a
			>
		</nav>
	</div>
</section>
