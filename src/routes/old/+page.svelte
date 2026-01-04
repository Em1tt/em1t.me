<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { sineIn, sineInOut, sineOut } from 'svelte/easing';
	import Scramble from '$lib/Scramble.svelte';
	import { Turnstile } from 'svelte-turnstile';

	let { data } = $props();

	import { toast } from 'svelte-sonner';

	let loading: string | number = '';

	let background: HTMLDivElement;
	let animationProgress = new Tween(1.5, {
		duration: 500,
		easing: sineIn
	});
	$effect(() => {
		if (animationProgress) {
			background.style.scale = `${animationProgress.current}`;
		}
		if (animationProgress.current == 1.3) {
			animationProgress.set(1.5, { duration: 1000, easing: sineInOut });
		}
	});
	function pulse() {
		animationProgress.set(1.3, { duration: 100, easing: sineOut });
	}

	import { onMount } from 'svelte';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
	import { enhance } from '$app/forms';

	let sections: NodeListOf<HTMLElement>;
	let navLinks: NodeListOf<HTMLAnchorElement>;

	onMount(() => {
		sections = document.querySelectorAll('section');
		navLinks = document.querySelectorAll('.fixed.top-4.left-4 a');
		console.log(sections);
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	});
	let current = '';

	function onScroll() {
		sections.forEach((section) => {
			const sectionTop = section.offsetTop;
			if (window.scrollY >= sectionTop - window.innerHeight / 2) {
				current = section.getAttribute('id') ?? '';
			}
		});

		navLinks.forEach((link) => {
			if (link.getAttribute('href')?.toString().includes(`#${current}`)) {
				link.classList.add('text-sky-500', 'ibm-plex-mono-bold');
				link.classList.remove('text-gray-400');
				link.innerText = link.innerText.replace('//', '-> ');
			} else {
				link.classList.remove('text-sky-500', 'ibm-plex-mono-bold');
				link.classList.add('text-gray-400');
				link.innerText = link.innerText.replace('->', '// ');
			}
		});
	}

	import * as m from '$lib/paraglide/messages.js';
	import GetInTouch from '$lib/GetInTouch.svelte';
	import { formatDate } from '$lib/utils';
</script>

<svelte:head>
    <title>Richard Em1t | Full-Stack Web Developer & Designer from Slovakia</title>
    <meta name="description" content="Full-stack web developer and designer from Slovakia specializing in modern web technologies like SvelteKit, React, TypeScript, and responsive design. View my portfolio and projects." />
    
    <!-- Keywords -->
    <meta name="keywords" content="web developer, full-stack developer, Slovakia, SvelteKit, React, TypeScript, JavaScript, web design, portfolio, Richard Em1t" />
    
    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Richard Em1t | Full-Stack Web Developer & Designer" />
    <meta property="og:description" content="Full-stack web developer and designer from Slovakia specializing in modern web technologies. View my portfolio and projects." />
    <meta property="og:url" content="https://em1t.me" />
    <meta property="og:site_name" content="Em1t Portfolio" />
    <meta property="og:image" content="https://em1t.me/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Richard Em1t - Full-Stack Web Developer Portfolio" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@Em1ttt" />
    <meta name="twitter:creator" content="@Em1ttt" />
    <meta name="twitter:title" content="Richard Em1t | Full-Stack Web Developer & Designer" />
    <meta name="twitter:description" content="Full-stack web developer and designer from Slovakia specializing in modern web technologies." />
    <meta name="twitter:image" content="https://em1t.me/og-image.png" />
</svelte:head>

<!--Layout inspired by GD Knots GetHappier-->
<div class="fixed top-4 left-4 z-40 flex flex-col">
	<a href="#background-wrapper" class="ibm-plex-mono-regular ibm-plex-mono-bold text-sky-500"
		>-> {m.navHome()}</a
	>
	<a href="#about" class="ibm-plex-mono-regular text-gray-400 hover:text-gray-200"
		>// {m.navAbout()}</a
	>
	<a href="#blog" class="ibm-plex-mono-regular text-gray-400 hover:text-gray-200"
		>// {m.navBlog()}</a
	>
	<a href="#projects" class="ibm-plex-mono-regular text-gray-400 hover:text-gray-200"
		>// {m.navProjects()}</a
	>
	<a href="#contact" class="ibm-plex-mono-regular text-gray-400 hover:text-gray-200"
		>// {m.navContact()}</a
	>
</div>

<div class="fixed top-4 right-4 z-40">
	<img src="/misc/E1.svg" alt="E1" width="32" height="32" />
</div>

<GetInTouch />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!--Background by Hyperplexed-->
<section
	onclick={pulse}
	id="background-wrapper"
	class="relative grid h-screen place-items-center overflow-hidden bg-slate-900"
>
	<div bind:this={background} id="container">
		<!--Background-->
		{#each Array.from({ length: 1600 }, (_, i) => i) as i}
			<div
				class="border border-solid border-sky-500/10 duration-1000 hover:bg-sky-600 hover:duration-0"
			></div>
		{/each}
	</div>
	<div id="radialGradient"></div>
	<div class="z-20">
		<Scramble>
			<h1 class="ibm-plex-mono-bold bg-sky-500 text-7xl text-white" data-value="EM1T.ME">
				EM1T.ME
			</h1>
		</Scramble>
		<h2 class="ibm-plex-mono-semibold-italic text-gray-400">{m.hero()}</h2>
	</div>
</section>
<section id="about" class="w-full overflow-x-hidden bg-slate-800 py-8">
	<div class="relative mx-auto w-full max-w-7xl px-8 md:px-20">
		<div class="top-10 left-0 mb-4 md:absolute md:mb-0 md:-rotate-90">
			<p class="ibm-plex-mono-regular-italic w-fit text-gray-400">{m.about()}</p>
		</div>
		<div class="flex flex-col gap-4 sm:flex-row">
			<img src="/misc/me.jpg" alt="Richard" width="384" height="384" class="aspect-square w-fit rounded sm:h-96 sm:w-96" />
			<div class="flex flex-col justify-center gap-4">
				<p class="ibm-plex-mono-regular text-white">
					{m.aboutText()}
				</p>
				<div class="hidden w-full grid-cols-5 grid-rows-2 gap-4 xl:grid">
					<div
						class="flex aspect-square w-32 flex-col items-center justify-center rounded bg-slate-900 text-center"
					>
						<img src="/skills/HTML5.png" width="64" height="64" class="w-20" alt="HTML5" />
						<p class="ibm-plex-mono-regular text-gray-200">HTML5</p>
					</div>
					<div
						class="flex aspect-square w-32 flex-col items-center justify-center rounded bg-slate-900 text-center"
					>
						<img src="/skills/css.svg" width="64" height="64" class="w-20" alt="CSS3" />
						<p class="ibm-plex-mono-regular text-gray-200">CSS3</p>
					</div>
					<div
						class="flex aspect-square w-32 flex-col items-center justify-center rounded bg-slate-900 text-center"
					>
						<img src="/skills/JS.png" width="64" height="64" class="w-20" alt="JavaScript" />
						<p class="ibm-plex-mono-regular text-gray-200">JavaScript</p>
					</div>
					<div
						class="flex aspect-square w-32 flex-col items-center justify-center rounded bg-slate-900 text-center"
					>
						<img src="/skills/ts-logo-512.svg" width="64" height="64" class="w-20" alt="TypeScript" />
						<p class="ibm-plex-mono-regular text-gray-200">TypeScript</p>
					</div>
					<div
						class="flex aspect-square w-32 flex-col items-center justify-center rounded bg-slate-900 text-center"
					>
						<img src="/skills/python.png" width="64" height="64" class="w-20" alt="Python" />
						<p class="ibm-plex-mono-regular text-gray-200">Python</p>
					</div>
					<div
						class="flex aspect-square w-32 flex-col items-center justify-center rounded bg-slate-900 text-center"
					>
						<img src="/skills/svelte.png" width="64" height="64" class="w-20" alt="Svelte" />
						<p class="ibm-plex-mono-regular text-gray-200">Svelte</p>
					</div>
					<div
						class="flex aspect-square w-32 flex-col items-center justify-center rounded bg-slate-900 text-center"
					>
						<img src="/skills/react.png" width="64" height="64" class="w-20" alt="React" />
						<p class="ibm-plex-mono-regular text-gray-200">React</p>
					</div>
					<div
						class="flex aspect-square w-32 flex-col items-center justify-center rounded bg-slate-900 text-center"
					>
						<img src="/skills/php.png" width="64" height="64" class="w-20" alt="PHP" />
						<p class="ibm-plex-mono-regular text-gray-200">PHP</p>
					</div>
					<div
						class="flex aspect-square w-32 flex-col items-center justify-center rounded bg-slate-900 text-center"
					>
						<img src="/skills/tailwindcss.svg" width="64" height="64" class="w-20" alt="TailwindCSS" />
						<p class="ibm-plex-mono-regular text-gray-200">TailwindCSS</p>
					</div>
					<div
						class="flex aspect-square w-32 flex-col items-center justify-center rounded bg-slate-900 text-center"
					>
						<img src="/skills/docker.png" width="64" height="64" class="w-20" alt="Docker" />
						<p class="ibm-plex-mono-regular text-gray-200">Docker</p>
					</div>
				</div>
			</div>
		</div>
		
		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
			<div class="flex w-full flex-row items-center gap-2 rounded bg-slate-900 p-2">
				<img  width="32" height="32" src="/skills/photoshop.jpg" alt="Photoshop" class="h-8 w-8 rounded" />
				<p class="ibm-plex-mono-regular text-gray-200">Adobe Photoshop</p>
			</div>
			<div class="flex w-full flex-row items-center gap-2 rounded bg-slate-900 p-2">
				<img width="32" height="32" src="/skills/illustrator.jpg" alt="Illustrator" class="h-8 w-8 rounded" />
				<p class="ibm-plex-mono-regular text-gray-200">Adobe Illustrator</p>
			</div>
			<div class="flex w-full flex-row items-center gap-2 rounded bg-slate-900 p-2">
				<img width="32" height="32" src="/skills/premiere.jpg" alt="Premiere Pro" class="h-8 w-8 rounded" />
				<p class="ibm-plex-mono-regular text-gray-200">Adobe Premiere Pro</p>
			</div>
			<div class="flex w-full flex-row items-center gap-2 rounded bg-slate-900 p-2">
				<img width="32" height="32" src="/skills/indesign.jpg" alt="InDesign" class="h-8 w-8 rounded" />
				<p class="ibm-plex-mono-regular text-gray-200">Adobe InDesign</p>
			</div>
		</div>
	</div>
</section>
<section id="blog" class="w-full bg-slate-900 py-8">
	<div class="relative mx-auto mt-12 w-full max-w-7xl px-8 md:px-20">
		<div class="top-10 left-4 mb-4 md:absolute md:mb-0 md:-rotate-90">
			<p class="ibm-plex-mono-regular-italic w-fit text-gray-400">{m.blog()}</p>
		</div>
		<div class="flex flex-col gap-4">
			<h2 class="text-center text-4xl font-bold text-gray-200">{m.blogHeader()}</h2>
			<!-- Featured Recent Post -->
			{#each data.posts.slice(0, 1) as post}
				<article
					class="featured-post group relative w-full overflow-hidden rounded border border-slate-600/30 bg-gradient-to-br from-slate-700/80 to-slate-900/90 p-8 transition-all duration-300 hover:border-sky-500/40 hover:shadow-2xl"
				>
					<div class="relative z-10">
						<div class="relative mb-4 inline-flex items-center">
							<span
								class="relative z-10 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white uppercase"
							>
								Latest Post
							</span>
							<div
								class="badge-glow absolute -inset-0.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-30"
							></div>
						</div>

						<h2 class="mb-4 text-3xl leading-tight font-bold">
							<a
								href="blog/{post.slug}"
								class="title-link text-slate-100 transition-all duration-300 hover:text-sky-500"
							>
								{post.title}
							</a>
						</h2>

						<time class="mb-4 block text-sm font-medium text-slate-400"
							>{formatDate(post.date)}</time
						>

						<p class="mb-6 text-lg leading-relaxed text-slate-300">{post.description}</p>

						<div class="mb-8 flex flex-wrap gap-2">
							{#each post.categories as category}
								<span
									class="rounded-md bg-slate-600/40 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors duration-200 hover:bg-slate-600/60 hover:text-white"
								>
									#{category}
								</span>
							{/each}
						</div>

						<div class="flex justify-end">
							<a
								href="blog/{post.slug}"
								class="inline-flex items-center gap-2 py-2 font-semibold text-sky-500 transition-all duration-200 hover:translate-x-1 hover:text-blue-500"
							>
								Read Article
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="m9 18 6-6-6-6" />
								</svg>
							</a>
						</div>
					</div>
				</article>
			{/each}
			<!--Style a button for other posts-->
			<a href="/blog"
				class="ibm-plex-mono-regular w-full text-center py-2 cursor-pointer rounded bg-slate-900 p-1 text-slate-200 hover:bg-slate-800"
				>{m.blogReadMore()}</a
			>
		</div>
	</div>
	<div id="radialGradient2"></div>
</section>
<section id="projects" class="w-full bg-slate-900 py-8">
	<div class="relative mx-auto w-full max-w-7xl px-8 md:px-20">
		<div class="top-10 left-0 mb-4 md:absolute md:mb-0 md:-rotate-90">
			<p class="ibm-plex-mono-regular-italic w-fit text-gray-400">{m.projects()}</p>
		</div>
		<div class="grid grid-cols-1 gap-4">
			<div class="flex w-full flex-col gap-2 border-l border-solid border-sky-400 px-4 py-2">
				<div class="flex w-full flex-row items-center gap-2">
					<img src="/misc/E1.svg" width="32" height="32" alt="E1" class="h-8 w-8 rounded" />
					<p class="ibm-plex-mono-regular text-gray-200">Em1t.me</p>
				</div>
				<p class="ibm-plex-mono-regular text-gray-200">
					{m.projectsEm1tme()}
				</p>
				<div class="flex flex-row gap-4">
					<a
						class="ibm-plex-mono-regular flex flex-row items-center gap-1 text-sky-400 hover:text-gray-200"
						href="https://github.com/hallify-sk/Hallify"
						target="_blank"
						rel="noopener noreferrer"
					>
						<svg
							fill="currentColor"
							class="h-5 w-5"
							viewBox="0 0 48 48"
							xmlns="http://www.w3.org/2000/svg"
						>
							<title>github</title>
							<g id="Layer_2" data-name="Layer 2">
								<g id="invisible_box" data-name="invisible box">
									<rect width="48" height="48" fill="none" />
									<rect width="48" height="48" fill="none" />
								</g>
								<g id="icons_Q2" data-name="icons Q2">
									<path
										d="M24,1.9a21.6,21.6,0,0,0-6.8,42.2c1,.2,1.8-.9,1.8-1.8V39.4c-6,1.3-7.9-2.9-7.9-2.9a6.5,6.5,0,0,0-2.2-3.2C6.9,31.9,9,32,9,32a4.3,4.3,0,0,1,3.3,2c1.7,2.9,5.5,2.6,6.7,2.1a5.4,5.4,0,0,1,.5-2.9C12.7,32,9,28,9,22.6A10.7,10.7,0,0,1,11.9,15a6.2,6.2,0,0,1,.3-6.4,8.9,8.9,0,0,1,6.4,2.9,15.1,15.1,0,0,1,5.4-.8,17.1,17.1,0,0,1,5.4.7,9,9,0,0,1,6.4-2.8,6.5,6.5,0,0,1,.4,6.4A10.7,10.7,0,0,1,39,22.6C39,28,35.3,32,28.5,33.2a5.4,5.4,0,0,1,.5,2.9v6.2a1.8,1.8,0,0,0,1.9,1.8A21.7,21.7,0,0,0,24,1.9Z"
									/>
								</g>
							</g>
						</svg>
						GitHub</a
					>
				</div>
				<p class="ibm-plex-mono-regular-italic text-gray-400">{m.projectsEm1tmeDate()}</p>
			</div>
			<div class="flex w-full flex-col gap-2 border-l border-solid border-sky-400 px-4 py-2">
				<div class="flex w-full flex-row items-center gap-2">
					<img width="32" height="32" src="/projects/Hallify.svg" alt="Hallify.sk" class="h-8 w-8 rounded" />
					<p class="ibm-plex-mono-regular text-gray-200">Hallify.sk</p>
				</div>
				<p class="ibm-plex-mono-regular text-gray-200">
					{m.projectsHallifysk()}
				</p>
				<div class="flex flex-row gap-4">
					<a
						class="ibm-plex-mono-regular flex flex-row items-center gap-1 text-sky-400 hover:text-gray-200"
						href="https://hallify.sk"
						target="_blank"
						rel="noopener noreferrer"
					>
						<svg
							data-slot="icon"
							aria-hidden="true"
							fill="none"
							class="h-5 w-5"
							stroke-width="1.5"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
								stroke-linecap="round"
								stroke-linejoin="round"
							></path>
						</svg>
						Link</a
					>
					<a
						class="ibm-plex-mono-regular flex flex-row items-center gap-1 text-sky-400 hover:text-gray-200"
						href="/"
					>
						<svg
							fill="currentColor"
							class="h-5 w-5"
							viewBox="0 0 48 48"
							xmlns="http://www.w3.org/2000/svg"
						>
							<title>github</title>
							<g id="Layer_2" data-name="Layer 2">
								<g id="invisible_box" data-name="invisible box">
									<rect width="48" height="48" fill="none" />
									<rect width="48" height="48" fill="none" />
								</g>
								<g id="icons_Q2" data-name="icons Q2">
									<path
										d="M24,1.9a21.6,21.6,0,0,0-6.8,42.2c1,.2,1.8-.9,1.8-1.8V39.4c-6,1.3-7.9-2.9-7.9-2.9a6.5,6.5,0,0,0-2.2-3.2C6.9,31.9,9,32,9,32a4.3,4.3,0,0,1,3.3,2c1.7,2.9,5.5,2.6,6.7,2.1a5.4,5.4,0,0,1,.5-2.9C12.7,32,9,28,9,22.6A10.7,10.7,0,0,1,11.9,15a6.2,6.2,0,0,1,.3-6.4,8.9,8.9,0,0,1,6.4,2.9,15.1,15.1,0,0,1,5.4-.8,17.1,17.1,0,0,1,5.4.7,9,9,0,0,1,6.4-2.8,6.5,6.5,0,0,1,.4,6.4A10.7,10.7,0,0,1,39,22.6C39,28,35.3,32,28.5,33.2a5.4,5.4,0,0,1,.5,2.9v6.2a1.8,1.8,0,0,0,1.9,1.8A21.7,21.7,0,0,0,24,1.9Z"
									/>
								</g>
							</g>
						</svg>
						GitHub</a
					>
				</div>
				<p class="ibm-plex-mono-regular-italic text-gray-400">{m.projectsHallifyskDate()}</p>
			</div>
			<div class="flex w-full flex-col gap-2 border-l border-solid border-sky-400 px-4 py-2">
				<div class="flex w-full flex-row items-center gap-2">
					<img width="88" height="32" src="/projects/tatrapak.png" alt="Tatrapak" class="h-8 rounded" />
					<p class="ibm-plex-mono-regular text-gray-200">{m.projectsTatrapakName()}</p>
				</div>
				<p class="ibm-plex-mono-regular text-gray-200">
					{m.projectsTatrapak()}
				</p>
				<div class="flex flex-row gap-4">
					<a
						class="ibm-plex-mono-regular flex flex-row items-center gap-1 text-sky-400 hover:text-gray-200"
						href="https://github.com/Em1tt/tatrapak-portal"
					>
						<svg
							fill="currentColor"
							class="h-5 w-5"
							viewBox="0 0 48 48"
							xmlns="http://www.w3.org/2000/svg"
						>
							<title>github</title>
							<g id="Layer_2" data-name="Layer 2">
								<g id="invisible_box" data-name="invisible box">
									<rect width="48" height="48" fill="none" />
									<rect width="48" height="48" fill="none" />
								</g>
								<g id="icons_Q2" data-name="icons Q2">
									<path
										d="M24,1.9a21.6,21.6,0,0,0-6.8,42.2c1,.2,1.8-.9,1.8-1.8V39.4c-6,1.3-7.9-2.9-7.9-2.9a6.5,6.5,0,0,0-2.2-3.2C6.9,31.9,9,32,9,32a4.3,4.3,0,0,1,3.3,2c1.7,2.9,5.5,2.6,6.7,2.1a5.4,5.4,0,0,1,.5-2.9C12.7,32,9,28,9,22.6A10.7,10.7,0,0,1,11.9,15a6.2,6.2,0,0,1,.3-6.4,8.9,8.9,0,0,1,6.4,2.9,15.1,15.1,0,0,1,5.4-.8,17.1,17.1,0,0,1,5.4.7,9,9,0,0,1,6.4-2.8,6.5,6.5,0,0,1,.4,6.4A10.7,10.7,0,0,1,39,22.6C39,28,35.3,32,28.5,33.2a5.4,5.4,0,0,1,.5,2.9v6.2a1.8,1.8,0,0,0,1.9,1.8A21.7,21.7,0,0,0,24,1.9Z"
									/>
								</g>
							</g>
						</svg>
						GitHub</a
					>
				</div>
				<p class="ibm-plex-mono-regular-italic text-gray-400">
					{m.projectsTatrapakDate()}
				</p>
			</div>
			<div class="flex w-full flex-col gap-2 border-l border-solid border-sky-400 px-4 py-2">
				<div class="flex w-full flex-row items-center gap-2">
					<img width="32" height="32" src="/projects/ssosta.chat.png" alt="ssosta.chat" class="h-8 rounded" />
					<p class="ibm-plex-mono-regular text-gray-200">ssosta.chat</p>
				</div>
				<p class="ibm-plex-mono-regular text-gray-200">
					{m.projectsSsostaChat()}
				</p>
				<div class="flex flex-row gap-4">
					<a
						class="ibm-plex-mono-regular flex flex-row items-center gap-1 text-sky-400 hover:text-gray-200"
						href="https://www.instagram.com/ssosta.chat/"
						target="_blank"
						rel="noopener noreferrer"
					>
						<svg
							data-slot="icon"
							aria-hidden="true"
							fill="none"
							class="h-5 w-5"
							stroke-width="1.5"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
								stroke-linecap="round"
								stroke-linejoin="round"
							></path>
						</svg>
						Link</a
					>
					<a
						class="ibm-plex-mono-regular flex flex-row items-center gap-1 text-sky-400 hover:text-gray-200"
						href="https://github.com/Em1tt/ssosta.chat"
					>
						<svg
							fill="currentColor"
							class="h-5 w-5"
							viewBox="0 0 48 48"
							xmlns="http://www.w3.org/2000/svg"
						>
							<title>github</title>
							<g id="Layer_2" data-name="Layer 2">
								<g id="invisible_box" data-name="invisible box">
									<rect width="48" height="48" fill="none" />
									<rect width="48" height="48" fill="none" />
								</g>
								<g id="icons_Q2" data-name="icons Q2">
									<path
										d="M24,1.9a21.6,21.6,0,0,0-6.8,42.2c1,.2,1.8-.9,1.8-1.8V39.4c-6,1.3-7.9-2.9-7.9-2.9a6.5,6.5,0,0,0-2.2-3.2C6.9,31.9,9,32,9,32a4.3,4.3,0,0,1,3.3,2c1.7,2.9,5.5,2.6,6.7,2.1a5.4,5.4,0,0,1,.5-2.9C12.7,32,9,28,9,22.6A10.7,10.7,0,0,1,11.9,15a6.2,6.2,0,0,1,.3-6.4,8.9,8.9,0,0,1,6.4,2.9,15.1,15.1,0,0,1,5.4-.8,17.1,17.1,0,0,1,5.4.7,9,9,0,0,1,6.4-2.8,6.5,6.5,0,0,1,.4,6.4A10.7,10.7,0,0,1,39,22.6C39,28,35.3,32,28.5,33.2a5.4,5.4,0,0,1,.5,2.9v6.2a1.8,1.8,0,0,0,1.9,1.8A21.7,21.7,0,0,0,24,1.9Z"
									/>
								</g>
							</g>
						</svg>
						GitHub</a
					>
				</div>
				<p class="ibm-plex-mono-regular-italic text-gray-400">{m.projectsSsostaChatDate()}</p>
			</div>
		</div>
	</div>
</section>
<section
	id="contact"
	class="w-full bg-slate-950 bg-gradient-to-br from-slate-950 to-slate-900 py-8 pb-20"
>
	<div class="relative mx-auto w-full max-w-7xl px-8 md:px-20">
		<div class="top-10 left-0 mb-4 md:absolute md:mb-0 md:-rotate-90">
			<p class="ibm-plex-mono-regular-italic w-fit text-gray-400">{m.contact()}</p>
		</div>
		<div class="flex flex-col md:flex-row">
			<form
				use:enhance={() => {
					loading = toast.loading('Sending message...');
					return async ({ result }) => {
						toast.dismiss(loading);
						if (result.type == 'success') {
							toast.success('Message sent successfully!');
						} else if (result.type == 'failure') {
							if (result.data?.validation) {
								toast.error('Please fill in all fields.');
							} else if (result.data?.captcha) {
								toast.error('Captcha validation failed. Refresh the page and try again.');
							} else {
								toast.error('An error occurred while sending the message.');
							}
						}
						console.log(result);
					};
				}}
				method="post"
				action="?/contact"
				class="flex w-full flex-col gap-5 rounded-t bg-radial-[at_50%_0%] from-sky-400 to-sky-600 p-4 md:rounded-l md:rounded-tr-none"
			>
				<h2 class="ibm-plex-mono-semibold text-center text-xl text-white">
					{m.contactHeaderMessage()}
				</h2>
				<div class="relative">
					<input
						type="text"
						id="name"
						name="name"
						placeholder=" "
						class="peer ibm-plex-mono-regular w-full border-b border-solid border-b-slate-200/40 p-1 text-slate-100 outline-none"
					/>
					<label
						for="name"
						class="ibm-plex-mono-regular peer-focus:top pointer-events-none absolute -top-4 left-1 text-sm text-sky-300 duration-200 peer-placeholder-shown:top-1 peer-placeholder-shown:left-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200 peer-focus:-top-4 peer-focus:left-1 peer-focus:text-sm peer-focus:text-sky-300"
						>{m.contactName()}</label
					>
				</div>
				<div class="relative">
					<input
						type="email"
						id="email"
						name="email"
						placeholder=" "
						class="peer ibm-plex-mono-regular w-full border-b border-solid border-b-slate-200/40 p-1 text-slate-100 outline-none"
					/>
					<label
						for="email"
						class="ibm-plex-mono-regular peer-focus:top pointer-events-none absolute -top-4 left-1 text-sm text-sky-300 duration-200 peer-placeholder-shown:top-1 peer-placeholder-shown:left-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200 peer-focus:-top-4 peer-focus:left-1 peer-focus:text-sm peer-focus:text-sky-300"
						>{m.contactEmail()}</label
					>
				</div>
				<div class="relative">
					<input
						type="text"
						id="subject"
						name="subject"
						placeholder=" "
						class="peer ibm-plex-mono-regular w-full border-b border-solid border-b-slate-200/40 p-1 text-slate-100 outline-none"
					/>
					<label
						for="subject"
						class="ibm-plex-mono-regular peer-focus:top pointer-events-none absolute -top-4 left-1 text-sm text-sky-300 duration-200 peer-placeholder-shown:top-1 peer-placeholder-shown:left-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200 peer-focus:-top-4 peer-focus:left-1 peer-focus:text-sm peer-focus:text-sky-300"
						>{m.contactSubject()}</label
					>
				</div>
				<div class="relative">
					<textarea
						id="content"
						name="content"
						placeholder=" "
						class="peer ibm-plex-mono-regular field-sizing-content max-h-60 min-h-20 w-full border-b border-solid border-b-slate-200/40 p-1 text-slate-100 outline-none"
					></textarea>
					<label
						for="content"
						class="ibm-plex-mono-regular peer-focus:top pointer-events-none absolute -top-4 left-1 text-sm text-sky-300 duration-200 peer-placeholder-shown:top-1 peer-placeholder-shown:left-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200 peer-focus:-top-4 peer-focus:left-1 peer-focus:text-sm peer-focus:text-sky-300"
						>{m.contactContent()}</label
					>
				</div>
				<Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} size="invisible" />
				<button
					class="ibm-plex-mono-regular w-full cursor-pointer rounded bg-slate-900 p-1 text-slate-200 hover:bg-slate-800"
					>{m.contactSubmit()}</button
				>
			</form>
			<div
				class="flex w-full flex-col gap-4 rounded-b bg-slate-900 p-4 md:rounded-r md:rounded-bl-none"
			>
				<h2 class="ibm-plex-mono-semibold text-center text-xl text-white">
					{m.contactHeaderInformation()}
				</h2>
				<div class="flex flex-col justify-center gap-4">
					<p class="ibm-plex-mono-semibold flex flex-row items-center gap-1 text-slate-200">
						<svg
							data-slot="icon"
							aria-hidden="true"
							class="h-6 w-6"
							fill="none"
							stroke-width="1.5"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25"
								stroke-linecap="round"
								stroke-linejoin="round"
							></path>
						</svg>
						Email: <span class="text-sky-400">em1t.dev@&#8203;proton.me</span>
					</p>
					<p class="ibm-plex-mono-semibold flex flex-row items-center gap-1 text-slate-200">
						<svg
							fill="currentColor"
							class="h-6 w-6"
							viewBox="0 0 48 48"
							xmlns="http://www.w3.org/2000/svg"
						>
							<title>github</title>
							<g id="Layer_2" data-name="Layer 2">
								<g id="invisible_box" data-name="invisible box">
									<rect width="48" height="48" fill="none" />
									<rect width="48" height="48" fill="none" />
								</g>
								<g id="icons_Q2" data-name="icons Q2">
									<path
										d="M24,1.9a21.6,21.6,0,0,0-6.8,42.2c1,.2,1.8-.9,1.8-1.8V39.4c-6,1.3-7.9-2.9-7.9-2.9a6.5,6.5,0,0,0-2.2-3.2C6.9,31.9,9,32,9,32a4.3,4.3,0,0,1,3.3,2c1.7,2.9,5.5,2.6,6.7,2.1a5.4,5.4,0,0,1,.5-2.9C12.7,32,9,28,9,22.6A10.7,10.7,0,0,1,11.9,15a6.2,6.2,0,0,1,.3-6.4,8.9,8.9,0,0,1,6.4,2.9,15.1,15.1,0,0,1,5.4-.8,17.1,17.1,0,0,1,5.4.7,9,9,0,0,1,6.4-2.8,6.5,6.5,0,0,1,.4,6.4A10.7,10.7,0,0,1,39,22.6C39,28,35.3,32,28.5,33.2a5.4,5.4,0,0,1,.5,2.9v6.2a1.8,1.8,0,0,0,1.9,1.8A21.7,21.7,0,0,0,24,1.9Z"
									/>
								</g>
							</g>
						</svg>
						GitHub:
						<a href="https://github.com/Em1tt" class="text-sky-400 underline hover:text-slate-200"
							>Em1tt</a
						>
					</p>
				</div>
			</div>
		</div>
	</div>
</section>
<footer class="w-full bg-black py-12">
	<div class="relative mx-auto w-full max-w-7xl px-8 md:px-20">
		<p class="ibm-plex-mono-regular-italic text-center text-gray-400">
			//© {new Date().getFullYear()} Em1t. All rights reserved.
		</p>
	</div>
</footer>

<style lang="postcss">
	:global(html) {
		scroll-behavior: smooth;
	}
	#container {
		z-index: 0;
		@apply absolute -top-[30rem] -left-[40rem] grid aspect-square w-[180rem] grid-cols-40 grid-rows-40;
		transform: rotateX(50deg) rotateY(-5deg) rotateZ(20deg);
	}
	#container::before {
		content: ' ';
		z-index: 1;
		@apply pointer-events-none absolute -top-[30rem] -left-[40rem] grid aspect-square w-[180rem] grid-cols-40 grid-rows-40 bg-repeat opacity-10;
		background-image: url('https://assets.codepen.io/1468070/plus-pattern-center.png');
		background-size: 5%;
		background-position: -8px -24px;
	}
	#radialGradient {
		z-index: 2;
		background-image: radial-gradient(circle, rgba(0, 212, 255, 0) 0%, rgba(0, 0, 0, 0.8) 100%);
		position: absolute;
		pointer-events: none;
		width: 100%;
		height: 100%;
	}
	#radialGradient2 {
		position: absolute;
		bottom: 0;
		z-index: 3;
		background-image: radial-gradient(
			ellipse 150% 100% at bottom center,
			rgba(14, 233, 32, 0.07) 0%,
			rgba(0, 0, 0, 0) 40%
		);
		position: absolute;
		pointer-events: none;
		width: 100vw;
		height: 100vh;
		z-index: 1;
	}
	#about, #blog {
		position: relative;
		--dot-bg: oklch(0.129 0.042 264.695);
		--dot-color: #1d293d;
		--dot-size: 1px;
		--dot-space: 22px;
		background:
			linear-gradient(90deg, var(--dot-bg) calc(var(--dot-space) - var(--dot-size)), transparent 1%)
				center / var(--dot-space) var(--dot-space),
			linear-gradient(var(--dot-bg) calc(var(--dot-space) - var(--dot-size)), transparent 1%)
				center / var(--dot-space) var(--dot-space),
			var(--dot-color);
	}
	#projects {
		background:
			linear-gradient(90deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.85) 100%),
			url('/misc/noise.png'), url('/misc/Art.png');
		background-size: cover;
		background-repeat: no-repeat;
	}
</style>
