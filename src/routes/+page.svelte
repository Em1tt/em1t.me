<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { sineIn, sineInOut, sineOut } from 'svelte/easing';
	import Scramble from '$lib/Scramble.svelte';
	import { Turnstile } from 'svelte-turnstile';

	import toast from 'svelte-5-french-toast'

	let loading = "";

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
</script>

<svelte:head>
	<title>{m.title()}</title>
	<meta
		name="description"
		content={m.description()}
	/>
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:creator" content="@Em1ttt" />
	<meta property="og:url" content="https://em1t.me" />
	<meta property="og:title" content="Em1t | Developer & designer" />
	<meta
		property="og:description"
		content={m.description()}
	/>
	<!--
    <meta property="og:image" content="https://em1t.dev/Em1t.png" />
	<meta property="og:image:secure_url" content="https://em1t.dev/Em1t.png" />
	<meta property="og:image:type" content="image/png">
	<meta property="og:image:width" content="840">
	<meta property="og:image:height" content="590">
	-->
</svelte:head>


<!--Layout inspired by GD Knots GetHappier-->
<div class="fixed top-4 left-4 flex flex-col z-40">
	<a href="#background-wrapper" class="text-sky-500 ibm-plex-mono-regular ibm-plex-mono-bold"
		>-> {m.navHome()}</a
	>
	<a href="#about" class="text-gray-400 hover:text-gray-200 ibm-plex-mono-regular">// {m.navAbout()}</a>
	<a href="#projects" class="text-gray-400 hover:text-gray-200 ibm-plex-mono-regular">// {m.navProjects()}</a
	>
	<a href="#contact" class="text-gray-400 hover:text-gray-200 ibm-plex-mono-regular">// {m.navContact()}</a>
</div>

<div class="fixed top-4 right-4 z-40">
	<img src="/E1.svg" alt="E1" width="32" />
</div>

<div class="fixed bottom-4 left-4 z-40 hidden 2xl:block">
	<p class="text-gray-400 text ibm-plex-mono-regular-italic">// Richard Marcinčák</p>
	<a href="/#contact" class="text-gray-200 hover:text-sky-400 text-4xl ibm-plex-mono-regular"
		>{m.getInTouch()}</a
	>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!--Background by Hyperplexed-->
<section
	onclick={pulse}
	id="background-wrapper"
	class="h-screen bg-slate-900 overflow-hidden relative grid place-items-center"
>
	<div bind:this={background} id="container">
		<!--Background-->
		{#each Array.from({ length: 1600 }, (_, i) => i) as i}
			<div
				class="border border-solid border-sky-500/10 duration-1000 hover:duration-0 hover:bg-sky-600"
			></div>
		{/each}
	</div>
	<div id="radialGradient"></div>
	<div class="z-20">
		<Scramble>
			<h1 class="text-white bg-sky-500 ibm-plex-mono-bold text-7xl" data-value="EM1T.ME">
				EM1T.ME
			</h1>
		</Scramble>
		<h2 class="ibm-plex-mono-semibold-italic text-gray-400">{m.hero()}</h2>
	</div>
</section>
<section id="about" class="w-full bg-slate-800 py-8">
	<div class="w-full max-w-7xl mx-auto px-8 md:px-20 relative">
		<div class="md:absolute top-10 left-0 md:-rotate-90 mb-4 md:mb-0">
			<p class="text-gray-400 ibm-plex-mono-regular-italic w-fit">{m.about()}</p>
		</div>
		<div class="flex flex-col sm:flex-row gap-4">
			<img
				src="/Riško.jpg"
				alt="portrait of Richard Marcinčák"
				class="w-fit aspect-square sm:w-96 sm:h-96 rounded"
			/>
			<div class="flex flex-col gap-4 justify-center">
				<p class="text-white ibm-plex-mono-regular">
					{m.aboutText()}
				</p>
				<div class="xl:grid grid-cols-5 w-full grid-rows-2 gap-4 hidden">
					<div
						class="w-32 flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
					>
						<img src="/HTML5.png" width="64" class="w-20" alt="HTML5" />
						<p class="text-gray-200 ibm-plex-mono-regular">HTML5</p>
					</div>
					<div
						class="w-32 flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
					>
						<img src="/css.svg" width="64" class="w-20" alt="CSS3" />
						<p class="text-gray-200 ibm-plex-mono-regular">CSS3</p>
					</div>
					<div
						class="w-32 flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
					>
						<img src="/JS.png" width="64" class="w-20" alt="JavaScript" />
						<p class="text-gray-200 ibm-plex-mono-regular">JavaScript</p>
					</div>
					<div
						class="w-32 flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
					>
						<img src="/ts-logo-512.svg" width="64" class="w-20" alt="TypeScript" />
						<p class="text-gray-200 ibm-plex-mono-regular">TypeScript</p>
					</div>
					<div
						class="w-32 flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
					>
						<img src="/python.png" width="64" class="w-20" alt="Python" />
						<p class="text-gray-200 ibm-plex-mono-regular">Python</p>
					</div>
					<div
						class="w-32 flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
					>
						<img src="/svelte.png" width="64" class="w-20" alt="Svelte" />
						<p class="text-gray-200 ibm-plex-mono-regular">Svelte</p>
					</div>
					<div
						class="w-32 flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
					>
						<img src="/react.png" width="64" class="w-20" alt="React" />
						<p class="text-gray-200 ibm-plex-mono-regular">React</p>
					</div>
					<div
						class="w-32 flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
					>
						<img src="/php.png" width="64" class="w-20" alt="PHP" />
						<p class="text-gray-200 ibm-plex-mono-regular">PHP</p>
					</div>
					<div
						class="w-32 flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
					>
						<img src="/tailwindcss.svg" width="64" class="w-20" alt="TailwindCSS" />
						<p class="text-gray-200 ibm-plex-mono-regular">TailwindCSS</p>
					</div>
					<div
						class="w-32 flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
					>
						<img src="/docker.png" width="64" class="w-20" alt="Docker" />
						<p class="text-gray-200 ibm-plex-mono-regular">Docker</p>
					</div>
				</div>
			</div>
		</div>
		<div
			class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 w-full grid-rows-2 gap-4 xl:hidden mt-4"
		>
			<div
				class="flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
			>
				<img src="/HTML5.png" width="64" class="w-20" alt="HTML5" />
				<p class="text-gray-200 ibm-plex-mono-regular">HTML5</p>
			</div>
			<div
				class="flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
			>
				<img src="/css.svg" width="64" class="w-20" alt="CSS3" />
				<p class="text-gray-200 ibm-plex-mono-regular">CSS3</p>
			</div>
			<div
				class="flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
			>
				<img src="/JS.png" width="64" class="w-20" alt="JavaScript" />
				<p class="text-gray-200 ibm-plex-mono-regular">JavaScript</p>
			</div>
			<div
				class="flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
			>
				<img src="/ts-logo-512.svg" width="64" class="w-20" alt="TypeScript" />
				<p class="text-gray-200 ibm-plex-mono-regular">TypeScript</p>
			</div>
			<div
				class="flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
			>
				<img src="/python.png" width="64" class="w-20" alt="Python" />
				<p class="text-gray-200 ibm-plex-mono-regular">Python</p>
			</div>
			<div
				class="flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
			>
				<img src="/svelte.png" width="64" class="w-20" alt="Svelte" />
				<p class="text-gray-200 ibm-plex-mono-regular">Svelte</p>
			</div>
			<div
				class="flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
			>
				<img src="/react.png" width="64" class="w-20" alt="React" />
				<p class="text-gray-200 ibm-plex-mono-regular">React</p>
			</div>
			<div
				class="flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
			>
				<img src="/php.png" width="64" class="w-20" alt="PHP" />
				<p class="text-gray-200 ibm-plex-mono-regular">PHP</p>
			</div>
			<div
				class="flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
			>
				<img src="/tailwindcss.svg" width="64" class="w-20" alt="TailwindCSS" />
				<p class="text-gray-200 ibm-plex-mono-regular">TailwindCSS</p>
			</div>
			<div
				class="flex flex-col items-center justify-center text-center bg-slate-900 aspect-square rounded"
			>
				<img src="/docker.png" width="64" class="w-20" alt="Docker" />
				<p class="text-gray-200 ibm-plex-mono-regular">Docker</p>
			</div>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
			<div class="rounded w-full flex flex-row gap-2 items-center p-2 bg-slate-900">
				<img src="/photoshop.jpg" alt="Photoshop" class="w-8 h-8 rounded" />
				<p class="text-gray-200 ibm-plex-mono-regular">Adobe Photoshop</p>
			</div>
			<div class="rounded w-full flex flex-row gap-2 items-center p-2 bg-slate-900">
				<img src="/illustrator.jpg" alt="Illustrator" class="w-8 h-8 rounded" />
				<p class="text-gray-200 ibm-plex-mono-regular">Adobe Illustrator</p>
			</div>
			<div class="rounded w-full flex flex-row gap-2 items-center p-2 bg-slate-900">
				<img src="/premiere.jpg" alt="Premiere Pro" class="w-8 h-8 rounded" />
				<p class="text-gray-200 ibm-plex-mono-regular">Adobe Premiere Pro</p>
			</div>
			<div class="rounded w-full flex flex-row gap-2 items-center p-2 bg-slate-900">
				<img src="/indesign.jpg" alt="InDesign" class="w-8 h-8 rounded" />
				<p class="text-gray-200 ibm-plex-mono-regular">Adobe InDesign</p>
			</div>
		</div>
	</div>
</section>
<section id="projects" class="w-full bg-slate-900 py-8">
	<div class="w-full max-w-7xl mx-auto px-8 md:px-20 relative">
		<div class="md:absolute top-10 left-0 md:-rotate-90 mb-4 md:mb-0">
			<p class="text-gray-400 ibm-plex-mono-regular-italic w-fit">{m.projects()}</p>
		</div>
		<div class="grid grid-cols-1 gap-4">
			<div class="w-full flex flex-col gap-2 border-l border-sky-400 border-solid py-2 px-4">
				<div class="flex flex-row w-full items-center gap-2">
					<img src="/E1.svg" alt="E1" class="w-8 h-8 rounded" />
					<p class="text-gray-200 ibm-plex-mono-regular">Em1t.me</p>
				</div>
				<p class="text-gray-200 ibm-plex-mono-regular">
					{m.projectsEm1tme()}
				</p>
				<div class="flex flex-row gap-4">
					<a
						class="text-sky-400 hover:text-gray-200 flex flex-row gap-1 ibm-plex-mono-regular items-center"
						href="https://github.com/hallify-sk/Hallify"
						target="_blank"
						rel="noopener noreferrer"
					>
						<svg
							fill="currentColor"
							class="w-5 h-5"
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
			<div class="w-full flex flex-col gap-2 border-l border-sky-400 border-solid py-2 px-4">
				<div class="flex flex-row w-full items-center gap-2">
					<img src="/Hallify.svg" alt="Hallify.sk" class="w-8 h-8 rounded" />
					<p class="text-gray-200 ibm-plex-mono-regular">Hallify.sk</p>
				</div>
				<p class="text-gray-200 ibm-plex-mono-regular">
					{m.projectsHallifysk()}
				</p>
				<div class="flex flex-row gap-4">
					<a
						class="text-sky-400 hover:text-gray-200 flex flex-row gap-1 ibm-plex-mono-regular items-center"
						href="https://hallify.sk"
						target="_blank"
						rel="noopener noreferrer"
					>
						<svg
							data-slot="icon"
							aria-hidden="true"
							fill="none"
							class="w-5 h-5"
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
						class="text-sky-400 hover:text-gray-200 flex flex-row gap-1 ibm-plex-mono-regular items-center"
						href="/"
					>
						<svg
							fill="currentColor"
							class="w-5 h-5"
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
			<div class="w-full flex flex-col gap-2 border-l border-sky-400 border-solid py-2 px-4">
				<div class="flex flex-row w-full items-center gap-2">
					<img src="/tatrapak.png" alt="Tatrapak" class="h-8 rounded" />
					<p class="text-gray-200 ibm-plex-mono-regular">{m.projectsTatrapakName()}</p>
				</div>
				<p class="text-gray-200 ibm-plex-mono-regular">
					{m.projectsTatrapak()}
				</p>
				<div class="flex flex-row gap-4">
					<a
						class="text-sky-400 hover:text-gray-200 flex flex-row gap-1 ibm-plex-mono-regular items-center"
						href="https://github.com/Em1tt/tatrapak-portal"
					>
						<svg
							fill="currentColor"
							class="w-5 h-5"
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
			<div class="w-full flex flex-col gap-2 border-l border-sky-400 border-solid py-2 px-4">
				<div class="flex flex-row w-full items-center gap-2">
					<img src="/ssosta.chat.png" alt="ssosta.chat" class="h-8 rounded" />
					<p class="text-gray-200 ibm-plex-mono-regular">ssosta.chat</p>
				</div>
				<p class="text-gray-200 ibm-plex-mono-regular">
					{m.projectsSsostaChat()}
				</p>
				<div class="flex flex-row gap-4">
					<a
						class="text-sky-400 hover:text-gray-200 flex flex-row gap-1 ibm-plex-mono-regular items-center"
						href="https://www.instagram.com/ssosta.chat/"
						target="_blank"
						rel="noopener noreferrer"
					>
						<svg
							data-slot="icon"
							aria-hidden="true"
							fill="none"
							class="w-5 h-5"
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
						class="text-sky-400 hover:text-gray-200 flex flex-row gap-1 ibm-plex-mono-regular items-center"
						href="https://github.com/Em1tt/ssosta.chat"
					>
						<svg
							fill="currentColor"
							class="w-5 h-5"
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
	class="w-full bg-slate-950 py-8 pb-20 bg-gradient-to-br from-slate-950 to-slate-900"
>
	<div class="w-full max-w-7xl mx-auto px-8 md:px-20 relative">
		<div class="md:absolute top-10 left-0 md:-rotate-90 mb-4 md:mb-0">
			<p class="text-gray-400 ibm-plex-mono-regular-italic w-fit">{m.contact()}</p>
		</div>
		<div class="flex flex-col md:flex-row">
			<form
				use:enhance={() => {
					loading = toast.loading('Sending message...');
					return async ({result}) => {
						toast.dismiss(loading);
						if(result.type == "success"){
							toast.success('Message sent successfully!');
						} else if(result.type == "failure") {
							if(result.data?.validation){
								toast.error('Please fill in all fields.');
							} else if(result.data?.captcha){
								toast.error('Captcha validation failed. Refresh the page and try again.');
							} else {
								toast.error('An error occurred while sending the message.');
							}
						}
						console.log(result);
					}
				}}
				method="post"
				action="?/contact"
				class="flex flex-col w-full bg-radial-[at_50%_0%] from-sky-400 to-sky-600 rounded-t md:rounded-tr-none md:rounded-l p-4 gap-5"
			>
				<h2 class="ibm-plex-mono-semibold text-xl text-center text-white">{m.contactHeaderMessage()}</h2>
				<div class="relative">
					<input
						type="text"
						id="name"
						name="name"
						placeholder=" "
						class="peer w-full ibm-plex-mono-regular p-1 border-b border-solid border-b-slate-200/40 text-slate-100 outline-none"
					/>
					<label
						for="Name"
						class="text-sky-300 pointer-events-none peer-focus:text-sky-300 ibm-plex-mono-regular absolute left-1 -top-4 text-sm peer-placeholder-shown:text-slate-200 peer-placeholder-shown:left-2 peer-placeholder-shown:top-1 peer-placeholder-shown:text-base peer-focus:left-1 peer-focus:-top-4 peer-focus:text-sm duration-200 peer-focus:top"
						>{m.contactName()}</label
					>
				</div>
				<div class="relative">
					<input
						type="email"
						id="email"
						name="email"
						placeholder=" "
						class="peer w-full ibm-plex-mono-regular p-1 border-b border-solid border-b-slate-200/40 text-slate-100 outline-none"
					/>
					<label
						for="email"
						class="text-sky-300 pointer-events-none peer-focus:text-sky-300 ibm-plex-mono-regular absolute left-1 -top-4 text-sm peer-placeholder-shown:text-slate-200 peer-placeholder-shown:left-2 peer-placeholder-shown:top-1 peer-placeholder-shown:text-base peer-focus:left-1 peer-focus:-top-4 peer-focus:text-sm duration-200 peer-focus:top"
						>{m.contactEmail()}</label
					>
				</div>
				<div class="relative">
					<input
						type="text"
						id="subject"
						name="subject"
						placeholder=" "
						class="peer w-full ibm-plex-mono-regular p-1 border-b border-solid border-b-slate-200/40 text-slate-100 outline-none"
					/>
					<label
						for="subject"
						class="text-sky-300 pointer-events-none peer-focus:text-sky-300 ibm-plex-mono-regular absolute left-1 -top-4 text-sm peer-placeholder-shown:text-slate-200 peer-placeholder-shown:left-2 peer-placeholder-shown:top-1 peer-placeholder-shown:text-base peer-focus:left-1 peer-focus:-top-4 peer-focus:text-sm duration-200 peer-focus:top"
						>{m.contactSubject()}</label
					>
				</div>
				<div class="relative">
					<textarea
						id="content"
						name="content"
						placeholder=" "
						class="peer field-sizing-content max-h-60 min-h-20 w-full ibm-plex-mono-regular p-1 border-b border-solid border-b-slate-200/40 text-slate-100 outline-none"
					></textarea>
					<label
						for="content"
						class="text-sky-300 pointer-events-none peer-focus:text-sky-300 ibm-plex-mono-regular absolute left-1 -top-4 text-sm peer-placeholder-shown:text-slate-200 peer-placeholder-shown:left-2 peer-placeholder-shown:top-1 peer-placeholder-shown:text-base peer-focus:left-1 peer-focus:-top-4 peer-focus:text-sm duration-200 peer-focus:top"
						>{m.contactContent()}</label
					>
				</div>
				<Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} size="invisible" />
				<button
					class="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 ibm-plex-mono-regular cursor-pointer rounded p-1"
					>{m.contactSubmit()}</button
				>
			</form>
			<div
				class="flex flex-col w-full bg-slate-900 rounded-b md:rounded-bl-none md:rounded-r p-4 gap-4"
			>
				<h2 class="ibm-plex-mono-semibold text-xl text-center text-white">{m.contactHeaderInformation()}</h2>
				<div class="flex flex-col justify-center gap-4">
					<p class="text-slate-200 ibm-plex-mono-semibold flex flex-row gap-1 items-center">
						<svg
							data-slot="icon"
							aria-hidden="true"
							class="w-6 h-6"
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
						Email: <span class="text-sky-400">marcincak@&#8203;proton.me</span>
					</p>
					<p class="text-slate-200 ibm-plex-mono-semibold flex flex-row gap-1 items-center">
						<svg
							fill="currentColor"
							class="w-5 h-5"
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
						GitHub: <a href="/" class="text-sky-400 hover:text-slate-200 underline">Em1tt</a>
					</p>
					<p class="text-slate-200 ibm-plex-mono-semibold flex flex-row gap-1 items-center">
						<svg
							class="w-4 h-4"
							fill="currentColor"
							height="800px"
							width="800px"
							version="1.1"
							id="Layer_1"
							xmlns="http://www.w3.org/2000/svg"
							xmlns:xlink="http://www.w3.org/1999/xlink"
							viewBox="0 0 310 310"
							xml:space="preserve"
						>
							<g id="XMLID_801_">
								<path
									id="XMLID_802_"
									d="M72.16,99.73H9.927c-2.762,0-5,2.239-5,5v199.928c0,2.762,2.238,5,5,5H72.16c2.762,0,5-2.238,5-5V104.73   C77.16,101.969,74.922,99.73,72.16,99.73z"
								/>
								<path
									id="XMLID_803_"
									d="M41.066,0.341C18.422,0.341,0,18.743,0,41.362C0,63.991,18.422,82.4,41.066,82.4   c22.626,0,41.033-18.41,41.033-41.038C82.1,18.743,63.692,0.341,41.066,0.341z"
								/>
								<path
									id="XMLID_804_"
									d="M230.454,94.761c-24.995,0-43.472,10.745-54.679,22.954V104.73c0-2.761-2.238-5-5-5h-59.599   c-2.762,0-5,2.239-5,5v199.928c0,2.762,2.238,5,5,5h62.097c2.762,0,5-2.238,5-5v-98.918c0-33.333,9.054-46.319,32.29-46.319   c25.306,0,27.317,20.818,27.317,48.034v97.204c0,2.762,2.238,5,5,5H305c2.762,0,5-2.238,5-5V194.995   C310,145.43,300.549,94.761,230.454,94.761z"
								/>
							</g>
						</svg>
						LinkedIn:
						<a
							href="https://www.linkedin.com/in/richard-marcincak/"
							target="_blank"
							rel="noreferrer noopener"
							class="text-sky-400 hover:text-slate-200 underline">Richard Marcinčák</a
						>
					</p>
				</div>
			</div>
		</div>
	</div>
</section>
<footer class="w-full bg-black py-12">
	<div class="w-full max-w-7xl mx-auto px-8 md:px-20 relative">
		<p class="ibm-plex-mono-regular-italic text-gray-400 text-center">
			//© {new Date().getFullYear()} Richard Marcinčák
		</p>
	</div>
</footer>

<style lang="postcss">
	:global(html) {
		scroll-behavior: smooth;
	}
	#container {
		z-index: 0;
		@apply aspect-square grid grid-rows-40 grid-cols-40 w-[180rem] absolute -left-[40rem] -top-[30rem];
		transform: rotateX(50deg) rotateY(-5deg) rotateZ(20deg);
	}
	#container::before {
		content: ' ';
		z-index: 1;
		@apply aspect-square pointer-events-none bg-repeat opacity-10 grid grid-rows-40 grid-cols-40 w-[180rem] absolute -left-[40rem] -top-[30rem];
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
	#about {
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
		background: linear-gradient(90deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.85) 100%),
			url('/noise.png'), url('/Art.png');
		background-size: cover;
		background-repeat: no-repeat;
	}
</style>
