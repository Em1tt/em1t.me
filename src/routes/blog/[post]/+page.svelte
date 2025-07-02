<script lang="ts">
	import { formatDate } from '$lib/utils';
	import TableOfContents from '$lib/components/TOC.svelte';
	import { onMount } from 'svelte';
	import { ChevronUp } from '@lucide/svelte';

	let { data } = $props();
	console.log(data);

	let showBackToTop = $state(false);

	onMount(() => {
		//Modify CSS variables
		document.documentElement.style.setProperty('--accent1', data.meta.accent1);
		document.documentElement.style.setProperty('--accent2', data.meta.accent2);

		// Back to top button visibility
		const handleScroll = () => {
			showBackToTop = window.scrollY > 300;
		};

		window.addEventListener('scroll', handleScroll);
		
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	};
</script>

<svelte:head>
    <title>{data.meta.title} | Em1t Blog</title>
    <meta name="description" content={data.meta.description} />
    <meta name="keywords" content={data.meta.categories.join(', ')} />
    
    <!-- Article specific meta -->
    <meta name="article:author" content="Richard Em1t" />
    <meta name="article:published_time" content={data.meta.date} />
    <meta name="article:section" content="Technology" />
    {#each data.meta.categories as category}
        <meta name="article:tag" content={category} />
    {/each}
    
    <!-- Open Graph -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content={data.meta.title} />
    <meta property="og:description" content={data.meta.description} />
    <meta property="og:url" content="https://em1t.me/blog/{data.meta.slug}" />
    <meta property="og:image" content="https://em1t.me/blog-images/{data.meta.slug}-og.png" />
    <meta property="og:article:author" content="Richard Em1t" />
    <meta property="og:article:published_time" content={data.meta.date} />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={data.meta.title} />
    <meta name="twitter:description" content={data.meta.description} />
    <meta name="twitter:image" content="https://em1t.me/blog-images/{data.meta.slug}-og.png" />
</svelte:head>

<!-- Desktop Back Link -->
<div class="fixed bottom-4 left-4 z-40 hidden xl:block">
    <p class="text-gray-400 text ibm-plex-mono-regular-italic">// Finished reading?</p>
    <a href="/blog" class="text-gray-200 hover:text-sky-400 text-4xl ibm-plex-mono-regular"
        >GoBack()</a
    >
</div>

<!-- Mobile Back Link -->
<div class="fixed bottom-4 left-4 z-40 xl:hidden">
    <a href="/blog" class="inline-flex items-center gap-2 rounded-md bg-slate-900/90 px-3 py-2 text-sm font-medium text-sky-500 backdrop-blur-sm transition-colors hover:bg-slate-800 hover:text-white">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
        </svg>
        Blog
    </a>
</div>

<!-- Back to Top Button -->
{#if showBackToTop}
    <button
        onclick={scrollToTop}
        class="back-to-top cursor-pointer fixed bottom-4 right-4 z-50 rounded-md bg-slate-900/90 p-3 text-sky-500 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-slate-800 hover:text-white hover:shadow-xl"
        aria-label="Back to top"
    >
        <ChevronUp />
    </button>
{/if}

<div class="min-h-screen">
    <div class="mx-auto flex max-w-6xl flex-col px-4 sm:px-6 lg:px-8 xl:flex-row xl:space-x-8">
        <!-- Main Article -->
        <article class="mt-8 flex-1 sm:mt-12 lg:mt-16 xl:mt-20">
            <!-- Mobile Back Link (inline) -->
            <div class="mb-4 xl:hidden">
                <a class="inline-flex items-center gap-2 text-sky-500 hover:text-slate-100" href="/blog">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m12 19-7-7 7-7"/>
                        <path d="M19 12H5"/>
                    </svg>
                    Back to blog
                </a>
            </div>

            <!-- Desktop Back Link (inline) -->
            <div class="mb-4 hidden xl:block">
                <a class="text-sky-500 hover:text-slate-100" href="/blog">Back to /blog</a>
            </div>

            <hgroup class="prose prose-slate prose-invert domine-700 max-w-none">
                <h1 class="text-slate-100 domine-700 text-2xl sm:text-3xl lg:text-4xl">{data.meta.title}</h1>
                <p class="text-sm sm:text-base">Published at {formatDate(data.meta.date)}</p>
            </hgroup>

            <div class="text-sky-500 flex flex-wrap gap-2 my-4">
                {#each data.meta.categories as category}
                    <a href="/blog?category={category}" class="text-sm hover:text-slate-200 rounded-md bg-slate-800/50 px-2 py-1">&num;{category}</a>
                {/each}
            </div>

            <!-- Table of Contents - Mobile/Tablet -->
            <div class="my-6 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 xl:hidden">
                <p class="text-sm font-semibold text-slate-300 uppercase mb-3">In this post</p>
                <div class="max-h-48 overflow-y-auto">
                    <TableOfContents />
                </div>
            </div>

            <div class="prose prose-slate prose-invert max-w-none prose-sm sm:prose-base lg:prose-lg mb-60">
                <data.content />
            </div>
        </article>

        <!-- Sidebar - Desktop Only -->
        <aside class="ibm-plex-mono-regular sticky top-20 hidden h-fit max-w-72 min-w-50 flex-shrink-0 xl:block">
            <p class="text-sm text-slate-500 uppercase">In this post</p>
            <div class="maxhCalc mt-4 overflow-y-auto">
                <TableOfContents />
            </div>
        </aside>
    </div>
</div>

<style lang="postcss">
    @reference "../../../app.css";

    .maxhCalc {
        max-height: calc(100vh - 10rem);
    }

    /* Custom scrollbar for TOC */
    .maxhCalc::-webkit-scrollbar {
        width: 6px;
    }

    .maxhCalc::-webkit-scrollbar-track {
        background: rgba(71, 85, 105, 0.1);
        border-radius: 3px;
    }

    .maxhCalc::-webkit-scrollbar-thumb {
        background: rgba(14, 165, 233, 0.3);
        border-radius: 3px;
        transition: background 0.2s ease;
    }

    .maxhCalc::-webkit-scrollbar-thumb:hover {
        background: rgba(14, 165, 233, 0.5);
    }

    /* Firefox scrollbar */
    .maxhCalc {
        scrollbar-width: thin;
        scrollbar-color: rgba(14, 165, 233, 0.3) rgba(71, 85, 105, 0.1);
    }

    /* Mobile TOC scrollbar */
    :global(.xl\\:hidden .overflow-y-auto)::-webkit-scrollbar {
        width: 6px;
    }

    :global(.xl\\:hidden .overflow-y-auto)::-webkit-scrollbar-track {
        background: rgba(71, 85, 105, 0.1);
        border-radius: 3px;
    }

    :global(.xl\\:hidden .overflow-y-auto)::-webkit-scrollbar-thumb {
        background: rgba(14, 165, 233, 0.3);
        border-radius: 3px;
        transition: background 0.2s ease;
    }

    :global(.xl\\:hidden .overflow-y-auto)::-webkit-scrollbar-thumb:hover {
        background: rgba(14, 165, 233, 0.5);
    }

    /* Firefox scrollbar for mobile TOC */
    :global(.xl\\:hidden .overflow-y-auto) {
        scrollbar-width: thin;
        scrollbar-color: rgba(14, 165, 233, 0.3) rgba(71, 85, 105, 0.1);
    }

    .back-to-top {
        transform: translateY(0);
        opacity: 1;
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    :global(#sections) {
        @apply hidden;
    }
    :global(#sections + ul) {
        @apply hidden;
    }
    :global(pre:has(code)) {
        @apply relative;
        overflow-x: auto;
    }

    /* Mobile code block improvements */
    @media (max-width: 640px) {
        :global(pre) {
            @apply mx-0 rounded-lg;
            font-size: 0.875rem;
        }
        
        :global(code) {
            @apply text-sm;
        }
    }

    :global(pre button.copy) {
        @apply absolute right-2 top-2 h-8 w-16 p-1 flex z-50 rounded items-center justify-center text-xs cursor-pointer;
        background:hsl(240, 21.10%, 12.90%);
    }

    /* Mobile copy button */
    @media (max-width: 640px) {
        :global(pre button.copy) {
            @apply w-12 h-7 text-xs;
        }
    }

    :global(pre button.copy .ready::before){
        content: "Copy";
    }

    :global(pre button.copy .success::before){
        display: none;
        content: "Copied!";
    }

    :global(pre button.copy.copied .success::before) {
        display: block;
    }

    :global(pre button.copy.copied .ready::before) {
        display: none;
    }

    :global(pre button.copy:hover){
        background:hsl(240, 21.10%, 10.90%);
    }

    :global(pre:has(.filename)) {
        padding-top: 3rem;
    }

    :global(pre .filename) {
        position: absolute;
        top: 1.5rem;
        left: 0.5rem;
        padding: 0.25rem 0.5rem;
        border-radius: 5px;
        translate: 0 -50%;
        background:hsl(240, 21.10%, 12.90%);
        font-size: 0.75rem;
    }

    /* Mobile filename improvements */
    @media (max-width: 640px) {
        :global(pre .filename) {
            @apply text-xs;
        }
    }

    /* Responsive typography for prose */
    :global(.prose h1) {
        @apply text-2xl sm:text-3xl lg:text-4xl;
    }
    
    :global(.prose h2) {
        @apply text-xl sm:text-2xl lg:text-3xl;
    }
    
    :global(.prose h3) {
        @apply text-lg sm:text-xl lg:text-2xl;
    }

    /* Mobile table improvements */
    :global(.prose table) {
        @apply text-sm;
        display: block;
        overflow-x: auto;
        white-space: nowrap;
    }

    @media (max-width: 640px) {
        :global(.prose table) {
            @apply text-xs;
        }
    }
</style>
