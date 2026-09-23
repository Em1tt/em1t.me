<script lang="ts">
	import { onMount } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import Seo from '$lib/components/Seo.svelte';
	import Contact from '$lib/components/sections/Contact.svelte';
	import WhatIDo from '$lib/components/sections/WhatIDo.svelte';
	import Work from '$lib/components/sections/Work.svelte';
	import Writing from '$lib/components/sections/Writing.svelte';
	import { SITE } from '$lib/site';
	import { pageByWheel } from '$lib/wheelPaging';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	onMount(() => pageByWheel());

	const person = {
		'@type': 'Person',
		'@id': `${SITE.url}/#person`,
		name: SITE.author,
		alternateName: 'Em1t',
		url: SITE.url,
		jobTitle: SITE.jobTitle,
		image: `${SITE.url}/apple-touch-icon.png`,
		sameAs: SITE.sameAs
	};
	const structured = {
		'@context': 'https://schema.org',
		'@graph': [
			person,
			{ '@type': 'WebSite', name: SITE.name, url: SITE.url, author: { '@id': person['@id'] } }
		]
	};

	const stats = [
		{ value: '7+', label: 'years of experience' },
		{ value: '20+', label: 'projects finished & shipped' },
		{ value: '17+', label: 'websites designed & launched' },
		{ value: '12+', label: 'happy clients' }
	];

	// Some browsers refuse autoplay even for muted video (LibreWolf does by default).
	// If the first play() is refused, start the loop on the visitor's first click, tap or key press.
	const playWhenAllowed: Attachment<HTMLVideoElement> = (video) => {
		const controller = new AbortController();
		const retry = () =>
			video.play().then(
				() => controller.abort(),
				() => {}
			);

		video.play().then(
			() => controller.abort(),
			() => {
				for (const type of ['pointerdown', 'pointerup', 'click', 'keydown']) {
					window.addEventListener(type, retry, { capture: true, signal: controller.signal });
				}
			}
		);
		return () => controller.abort();
	};
</script>

<Seo
	title="Richard Marcinčák · Full-stack developer & designer"
	description="Full-stack developer and designer from Slovakia, studying at Masaryk University in Brno. Case studies, a blog on game maths and CTF challenges, and how to reach me."
	jsonLd={structured}
/>

<div class="relative grid h-dvh w-full snap-start place-items-center">
	<div class="absolute top-4 left-4">
		<img src="/E1.svg" alt="" width="32" />
	</div>
	<div class="absolute bottom-4 left-4">
		<p class="google-sans-400 bg-black px-2 py-1 text-slate-200">
			[FULL-STACK DEVELOPER / DESIGNER]
		</p>
	</div>
	<div class="flex flex-col items-center gap-4 text-slate-200">
		<h1 class="google-sans-500 bg-black/80 px-4 py-2 text-center text-5xl font-bold">em1t.me</h1>
		<a
			href="#about"
			aria-label="Scroll down"
			class="animate-pulse duration-100 hover:scale-120 hover:animate-none"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-10"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
			</svg>
		</a>
	</div>
</div>
<video
	{@attach playWhenAllowed}
	class="absolute top-0 left-0 -z-1 h-dvh w-full object-cover"
	autoplay
	loop
	muted
	playsinline
>
	<source src="bg3.mp4" type="video/mp4" />
	Your browser does not support the video tag.
</video>
<section
	id="about"
	class="min-h-dvh w-full snap-start bg-[#05030f] bg-[url('/img2.png')] bg-cover bg-center bg-no-repeat px-4 text-slate-200 md:px-10 lg:px-20"
>
	<div
		class="mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-x-10 gap-y-7 py-[clamp(24px,6vh,72px)] md:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[minmax(0,1fr)]"
	>
		<div
			class="flex max-w-3xl flex-col items-start gap-[clamp(14px,2.4vh,26px)] md:col-span-2 lg:col-span-1"
		>
			<p class="google-sans-code-500 text-xs tracking-widest text-slate-400 uppercase">
				<span class="inline-block bg-[#05030f] px-[0.75em] py-[0.6em] leading-none">[About]</span>
			</p>
			<h2 class="google-sans-500 text-[clamp(38px,5.4vw,96px)] leading-[1.12] tracking-tight">
				<span class="bg-[#05030f] box-decoration-clone px-[0.14em] pb-[0.04em]">Hello, I'm</span>
				<span
					class="google-sans-700 bg-[#a91a06] box-decoration-clone px-[0.14em] pb-[0.04em] text-white"
					>Richard.</span
				>
			</h2>
			<p
				class="google-sans-code-400 text-[clamp(12px,0.9vw,14px)] leading-[2.1] tracking-[0.02em] text-slate-300"
			>
				<span class="bg-[#05030f] box-decoration-clone px-[0.65em] py-[0.4em]"
					>Full-stack developer & designer · from Slovakia · Masaryk University, Brno</span
				>
			</p>
			<p class="google-sans-400 max-w-[30em] text-[clamp(17px,1.32vw,23px)] leading-[1.92]">
				<span class="bg-[#05030f] box-decoration-clone px-[0.42em] py-[0.16em]"
					>I understood as a child that I enjoy working with computers. At eleven I started
					programming backend applications. Over time I found my way to the web, where I began
					experimenting with design and JavaScript. My love for the web eventually brought me to
					cybersecurity, where I build and solve (mostly) web challenges.</span
				>
			</p>
			<div class="mt-1 flex flex-wrap gap-2.5">
				<a
					href="#contact"
					class="google-sans-500 bg-[#a91a06] px-[1em] py-[0.62em] text-[clamp(15px,1.05vw,18px)] text-white transition-colors hover:bg-[#ff5640] hover:text-[#05030f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5640] motion-reduce:transition-none"
				>
					Contact me <span aria-hidden="true">→</span>
				</a>
				<a
					href="#what-i-do"
					class="google-sans-500 bg-[#05030f] px-[1em] py-[0.62em] text-[clamp(15px,1.05vw,18px)] text-slate-200 transition-colors hover:bg-[#ff5640] hover:text-[#05030f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5640] motion-reduce:transition-none"
				>
					Learn more
				</a>
			</div>
		</div>
		<ul
			class="google-sans-code-400 flex flex-col items-start gap-1.5 self-end text-[clamp(12px,0.85vw,14px)] leading-none text-slate-300 md:col-start-2 md:row-start-2 md:items-end lg:row-start-1"
		>
			{#each stats as stat (stat.label)}
				<li class="bg-[#05030f] px-[0.8em] py-[0.62em]">
					<span class="google-sans-code-600 mr-[0.4em] text-[#ff5640]">{stat.value}</span
					>{stat.label}
				</li>
			{/each}
		</ul>
	</div>
</section>
<WhatIDo />
<Work />
<Writing post={data.featuredPost} more={data.morePosts} />
<Contact />
