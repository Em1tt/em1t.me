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
	class="relative isolate grid min-h-dvh w-full grid-rows-[auto_1fr] overflow-hidden bg-[#05030f] text-slate-200 lg:grid-rows-[1fr]"
>
	<!-- Given the width, the figure lies under the copy. On a phone the copy covers it in black
	     strips, so there it gets a band of its own, where the spheres can actually be dragged. -->
	<div class="relative h-[min(42dvh,20rem)] lg:col-start-1 lg:row-start-1 lg:h-auto">
		<CollisionPlayground />
	</div>
	<div
		class="pointer-events-none relative z-1 mx-auto grid w-full max-w-7xl grid-rows-[auto_1fr_auto] gap-5 px-4 py-[clamp(24px,6vh,72px)] md:px-10 lg:col-start-1 lg:row-start-1 lg:px-20"
	>
		<SectionLabel>Blog</SectionLabel>
		<div class="flex max-w-[52rem] flex-col items-start gap-3.5 self-center">
			<p class="google-sans-code-400 text-[13px] text-slate-400">
				<span class="inline-block bg-[#05030f] px-[0.7em] py-[0.55em]"
					><time datetime={post.date}>{formatDate(post.date)}</time>{#if post.status}
						· <b class="google-sans-code-500 text-[#ff5640]">{post.status}</b>{/if}</span
				>
			</p>
			<h2 class="google-sans-500 text-[clamp(30px,4vw,72px)] leading-[1.16] tracking-tight">
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
				class="google-sans-500 pointer-events-auto inline-flex min-h-11 items-center gap-[0.4em] bg-[#a91a06] px-[1em] py-[0.62em] text-[clamp(15px,1.05vw,18px)] text-white transition-colors hover:bg-[#ff5640] hover:text-[#05030f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5640] motion-reduce:transition-none"
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
					class="flex min-h-11 items-center bg-[#05030f] px-[0.75em] py-[0.65em] text-slate-300 hover:bg-[#a91a06] hover:text-white md:min-h-0"
					>{other.title}</a
				>
			{/each}
			<a
				href={resolve('/blog')}
				class="flex min-h-11 items-center bg-[#05030f] px-[0.75em] py-[0.65em] text-[#ff5640] hover:bg-[#a91a06] hover:text-white md:min-h-0"
				>All posts →</a
			>
		</nav>
	</div>
</section>
