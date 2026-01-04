<script lang="ts">
	import Scramble from '$lib/Scramble.svelte';
	import AboutCard from '$lib/components/AboutCard.svelte';
	import Anchor from '$lib/components/Anchor.svelte';
	import Background1 from '$lib/components/Background1.svelte';
	import Card from '$lib/components/Card.svelte';
	import GlowText from '$lib/components/GlowText.svelte';
	import Square from '$lib/components/Square.svelte';
	import Beaker from '$lib/icons/Beaker.svelte';
	import Cog from '$lib/icons/Cog.svelte';
	import Sparkles from '$lib/icons/Sparkles.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { Turnstile } from 'svelte-turnstile';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
	import FolderOpen from '$lib/icons/FolderOpen.svelte';
	import Link from '$lib/icons/Link.svelte';
	import Header from '$lib/Header.svelte';

	let { data } = $props();
	let loading: string | number = '';
</script>

<Header />

<section class="grid min-h-screen place-items-center px-4">
	<div class="z-1 flex w-full max-w-4xl flex-col gap-4 text-center">
		<Scramble>
			<h1
				class="stack-sans-headline text-4xl text-stone-200 sm:text-5xl md:text-6xl lg:text-7xl"
				data-value="EM1T.ME"
			>
				EM1T.ME
			</h1>
		</Scramble>
		<h2 class="stack-sans-text text-sm font-normal text-stone-400 sm:text-base">{m.hero()}</h2>
		<div class="mx-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
			<Anchor type="button" href="/blog">Read blog</Anchor>
			<Anchor type="button" href="#contact">Contact me</Anchor>
		</div>
	</div>
	<Background1 />
</section>
<div
	class="absolute z-20 block h-[1px] w-full bg-radial from-orange-500 via-transparent to-transparent"
></div>

<section class="bg-stone-950">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
		<!-- Section Header -->
		<div class="mb-8 flex flex-col items-center sm:mb-12 lg:mb-16">
			<Square>
				<Sparkles />
			</Square>
			<h2 class="stack-sans-text mt-4 text-2xl text-stone-200 sm:text-3xl lg:text-4xl">
				About
				<GlowText>me</GlowText>
			</h2>
		</div>

		<!-- Main Content Grid -->
		<div class="grid gap-4 sm:gap-6 lg:grid-cols-2">
			<!-- Left Column: Photo & Intro -->
			<div class="flex flex-col gap-6">
				<AboutCard color="white" noPadding={true}>
					<img
						src="/me4.png"
						alt="Richard"
						class="mx-auto aspect-square w-full max-w-sm rounded-lg object-cover md:max-w-md lg:max-w-full"
					/>
				</AboutCard>
			</div>
			<!-- Right Column: Skills & Info -->
			<div class="flex flex-col gap-6">
				<!-- Stats Grid -->
				<AboutCard color="white">
					<p class="text-xs text-stone-600">// Description</p>
					<p class="stack-sans-text mt-2 text-sm leading-relaxed text-stone-300 sm:text-base">
						Hello, I'm Richard, a full-stack Web Developer and Designer from Slovakia, passionate
						about crafting compelling digital experiences. Currently studying in Czechia at Masaryk
						University, I specialize in creating modern and user friendly applications.
					</p>
				</AboutCard>
				<div class="grid grid-cols-2 gap-3 sm:gap-4">
					<AboutCard>
						<GlowText class="text-2xl sm:text-3xl">7+</GlowText>
						<div class="stack-sans-text mt-1 text-xs text-stone-400 sm:mt-2 sm:text-sm">
							Years of Experience
						</div>
					</AboutCard>
					<AboutCard>
						<GlowText class="text-2xl sm:text-3xl">20+</GlowText>
						<div class="stack-sans-text mt-1 text-xs text-stone-400 sm:mt-2 sm:text-sm">
							Projects Completed
						</div>
					</AboutCard>
					<AboutCard>
						<GlowText class="text-2xl sm:text-3xl">10+</GlowText>
						<div class="stack-sans-text mt-1 text-xs text-stone-400 sm:mt-2 sm:text-sm">
							Happy Clients
						</div>
					</AboutCard>
					<AboutCard>
						<GlowText class="text-2xl sm:text-3xl">15+</GlowText>
						<div class="stack-sans-text mt-1 text-xs text-stone-400 sm:mt-2 sm:text-sm">
							Technologies
						</div>
					</AboutCard>
					<AboutCard>
						<GlowText class="text-2xl sm:text-3xl">12+</GlowText>
						<div class="stack-sans-text mt-1 text-xs text-stone-400 sm:mt-2 sm:text-sm">
							Websites launched
						</div>
					</AboutCard>
					<AboutCard>
						<GlowText class="text-2xl sm:text-3xl">∞</GlowText>
						<div class="stack-sans-text mt-1 text-xs text-stone-400 sm:mt-2 sm:text-sm">
							Cups of Coffee
						</div>
					</AboutCard>
				</div>

				<!-- Additional Info -->
				<!--
				 <AboutCard>
					<h3 class="stack-sans-text mb-3 text-lg font-semibold text-stone-200">
						Learning & Exploring
					</h3>
					<div class="flex flex-col gap-3">
						<div class="flex items-start gap-3">
							<span class="mt-1 text-orange-500">🛡️</span>
							<p class="stack-sans-text text-sm leading-relaxed text-stone-300">
								Active member of <span class="font-semibold text-orange-500">Slovak Cyber Team</span
								>, learning cybersecurity through competitions and CTF challenges
							</p>
						</div>
						<div class="flex items-start gap-3">
							<span class="mt-1 text-orange-500">🔒</span>
							<p class="stack-sans-text text-sm leading-relaxed text-stone-300">
								Exploring <span class="font-semibold text-stone-200">web security</span> and learning
								to use tools like Burp Suite for security analysis
							</p>
						</div>
						<div class="flex items-start gap-3">
							<span class="mt-1 text-orange-500">📚</span>
							<p class="stack-sans-text text-sm leading-relaxed text-stone-300">
								Passionate about learning new technologies and expanding my skillset beyond web
								development
							</p>
						</div>
					</div>
				</AboutCard>-->
				<!-- Core Skills -->
				<!--
				 <AboutCard>
					<h3 class="stack-sans-text mb-4 text-xl text-stone-200">Core Technologies</h3>
					<div class="grid grid-cols-5 gap-3">
						<div
							class="group flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img src="/skills/HTML5.png" width="40" height="40" class="w-10" alt="HTML5" />
							<p class="stack-sans-text mt-2 text-xs text-stone-400 group-hover:text-stone-200">
								HTML5
							</p>
						</div>
						<div
							class="group flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img src="/skills/css.svg" width="40" height="40" class="w-10" alt="CSS3" />
							<p class="stack-sans-text mt-2 text-xs text-stone-400 group-hover:text-stone-200">
								CSS3
							</p>
						</div>
						<div
							class="group flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img src="/skills/JS.png" width="40" height="40" class="w-10" alt="JavaScript" />
							<p class="stack-sans-text mt-2 text-xs text-stone-400 group-hover:text-stone-200">
								JS
							</p>
						</div>
						<div
							class="group flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img
								src="/skills/ts-logo-512.svg"
								width="40"
								height="40"
								class="w-10"
								alt="TypeScript"
							/>
							<p class="stack-sans-text mt-2 text-xs text-stone-400 group-hover:text-stone-200">
								TS
							</p>
						</div>
						<div
							class="group flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img src="/skills/python.png" width="40" height="40" class="w-10" alt="Python" />
							<p class="stack-sans-text mt-2 text-xs text-stone-400 group-hover:text-stone-200">
								Python
							</p>
						</div>
						<div
							class="group flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img src="/skills/svelte.png" width="40" height="40" class="w-10" alt="Svelte" />
							<p class="stack-sans-text mt-2 text-xs text-stone-400 group-hover:text-stone-200">
								Svelte
							</p>
						</div>
						<div
							class="group flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img src="/skills/react.png" width="40" height="40" class="w-10" alt="React" />
							<p class="stack-sans-text mt-2 text-xs text-stone-400 group-hover:text-stone-200">
								React
							</p>
						</div>
						<div
							class="group flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img src="/skills/php.png" width="40" height="40" class="w-10" alt="PHP" />
							<p class="stack-sans-text mt-2 text-xs text-stone-400 group-hover:text-stone-200">
								PHP
							</p>
						</div>
						<div
							class="group flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img
								src="/skills/tailwindcss.svg"
								width="40"
								height="40"
								class="w-10"
								alt="TailwindCSS"
							/>
							<p class="stack-sans-text mt-2 text-xs text-stone-400 group-hover:text-stone-200">
								Tailwind
							</p>
						</div>
						<div
							class="group flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img src="/skills/docker.png" width="40" height="40" class="w-10" alt="Docker" />
							<p class="stack-sans-text mt-2 text-xs text-stone-400 group-hover:text-stone-200">
								Docker
							</p>
						</div>
						<div
							class="group flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<span class="text-3xl">⚡</span>
							<p class="stack-sans-text mt-2 text-xs text-stone-400 group-hover:text-stone-200">
								Assembly
							</p>
						</div>
						<div
							class="group flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<span class="text-3xl">🤖</span>
							<p class="stack-sans-text mt-2 text-xs text-stone-400 group-hover:text-stone-200">
								Lovable
							</p>
						</div>
					</div>
				</AboutCard>-->
				<!-- Cybersecurity Tools --><!---
				 <AboutCard>
					<h3 class="stack-sans-text mb-4 text-xl text-stone-200">Cybersecurity Tools</h3>
					<div class="flex flex-wrap gap-3">
						<div
							class="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-950 px-4 py-2 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<span class="text-lg">🔒</span>
							<p class="stack-sans-text text-sm text-stone-300">Burp Suite</p>
						</div>
						<div
							class="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-950 px-4 py-2 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<span class="text-lg">🎯</span>
							<p class="stack-sans-text text-sm text-stone-300">CTF Challenges</p>
						</div>
						<div
							class="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-950 px-4 py-2 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<span class="text-lg">🔐</span>
							<p class="stack-sans-text text-sm text-stone-300">Web Security</p>
						</div>
					</div>
				</AboutCard>-->
				<!-- Design Tools -->
				<!--
				<AboutCard>
					<h3 class="stack-sans-text mb-4 text-xl text-stone-200">Design Tools</h3>
					<div class="grid grid-cols-2 gap-3">
						<div
							class="flex items-center gap-3 rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img
								width="32"
								height="32"
								src="/skills/photoshop.jpg"
								alt="Photoshop"
								class="h-8 w-8 rounded"
							/>
							<p class="stack-sans-text text-sm text-stone-300">Photoshop</p>
						</div>
						<div
							class="flex items-center gap-3 rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img
								width="32"
								height="32"
								src="/skills/illustrator.jpg"
								alt="Illustrator"
								class="h-8 w-8 rounded"
							/>
							<p class="stack-sans-text text-sm text-stone-300">Illustrator</p>
						</div>
						<div
							class="flex items-center gap-3 rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img
								width="32"
								height="32"
								src="/skills/premiere.jpg"
								alt="Premiere Pro"
								class="h-8 w-8 rounded"
							/>
							<p class="stack-sans-text text-sm text-stone-300">Premiere Pro</p>
						</div>
						<div
							class="flex items-center gap-3 rounded-lg border border-stone-800 bg-stone-950 p-3 transition-all hover:border-orange-500/50 hover:bg-stone-900"
						>
							<img
								width="32"
								height="32"
								src="/skills/indesign.jpg"
								alt="InDesign"
								class="h-8 w-8 rounded"
							/>
							<p class="stack-sans-text text-sm text-stone-300">InDesign</p>
						</div>
					</div>
				</AboutCard>-->
			</div>
		</div>
	</div>
</section>

<section class="about bg-stone-950">
	<div class="mx-auto grid max-w-7xl place-items-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
		<Square>
			<Beaker />
		</Square>
		<h2 class="stack-sans-text mt-4 text-2xl text-stone-200 sm:text-3xl">
			What I've
			<GlowText>built.</GlowText>
		</h2>
		<div class="mt-6 grid w-full gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
			<!--<Card title="Pumplo" subtitle="Freelance designer & developer" iconSrc="/pumplo.svg" href="/">
				<p>
					I created a modern design language for
					<Anchor class="font-semibold">pumplo.com</Anchor>, and then worked on creating an app MVP
					in a team of five people.
				</p>
			</Card>-->
			<Card title="Hallify" subtitle="B2B & B2C web application" iconSrc="/projects/Hallify.svg" linkText="">
				<p>
					Hallify is a state-of-the-art reservation system for social halls that supports the
					creation of table & chair layouts.
				</p>
			</Card>
			<!--
			<Card
				title="Terapias de Priscos"
				subtitle="Front-end developer"
				iconSrc="/projects/terapias.png"
			>
				<p>
					In 2024, as part of the Erasmus+ programme, I got the opportunity to work abroad in
					Portugal as a front-end developer.
				</p>
			</Card>
			-->
			<Card title="Tatrapak" subtitle="Product management panel" iconSrc="/projects/pak.png" linkText="">
				<p>
					I've developed a web application to digitize Tatrapak's production order process,
					replacing the paper-based system.
				</p>
			</Card>

			<Card
				title="The Chosen Few"
				subtitle="A CLI rogue-like card game"
				iconSrc="/projects/terminal.png"
				linkText=""
			>
				<p>
					Originally supposed to be a tiny game, turned into a game with over 30 cards, 3 currencies
					and 5+ hours of playtime.
				</p>
			</Card>

			<Card
				title="ssosta.chat"
				subtitle="Real-time chatting app"
				iconSrc="/projects/ssosta.chat.png"
				linkText=""
			>
				<p>
					A tiny web chat application targeted for my high school, which allowed users to
					communicate with eachother anonymously.
				</p>
			</Card>
			<!--
			<Card title="Boostly.sk" subtitle="Freelance designer" iconSrc="/projects/boostly.png">
				<p>
					I work as a freelance designer for boostly.sk, creating beautiful and eye-catching
					marketing graphics for clients.
				</p>
			</Card>
			-->
		</div>
	</div>
</section>

<section id="bag" class="relative overflow-hidden bg-[url('/gradient.svg')] bg-cover bg-no-repeat">
	<div class="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
		<!-- Section Header -->
		<div class="mb-8 flex flex-col items-center sm:mb-10 lg:mb-12">
			<Square>
				<Cog />
			</Square>
			<h2 class="stack-sans-text mt-4 text-2xl text-stone-200 sm:text-3xl lg:text-4xl">
				Tech stack &
				<GlowText>expertise</GlowText>
			</h2>
		</div>

		<!-- Main Grid -->
		<div class="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-12">
			<!-- Slovak Cyber Team - Featured -->
			<div
				class="group relative overflow-hidden rounded-xl border border-orange-500/30 bg-gradient-to-br from-stone-900/95 via-stone-900/90 to-stone-950/95 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-orange-500/50 sm:rounded-2xl sm:p-6 md:col-span-2 lg:col-span-6"
			>
				<!-- Flag Background -->
				<div
					class="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden opacity-100 transition-opacity duration-300"
				>
					<img
						src="https://flagcdn.com/w640/sk.png"
						alt=""
						class="absolute top-1/2 left-0 h-auto w-full -translate-y-1/2 object-cover opacity-10 saturate-50"
						style="mask-image: linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 100%); -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 100%);"
					/>
				</div>
				<div class="relative z-10">
					<div class="mb-3 flex items-center gap-2 sm:gap-3">
						<div
							class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-xl ring-1 ring-orange-500/30 backdrop-blur-sm sm:h-12 sm:w-12 sm:text-2xl"
						>
							🛡️
						</div>
						<div>
							<h3
								class="stack-sans-text text-base font-semibold text-stone-100 sm:text-lg lg:text-xl"
							>
								Slovak Cyber Team
							</h3>
							<p class="stack-sans-text text-xs text-orange-400/90 sm:text-sm">Active Member</p>
						</div>
					</div>
					<p class="stack-sans-text mb-3 text-xs leading-relaxed text-stone-400 sm:mb-4 sm:text-sm">
						Competing in CTF competitions, focusing on web exploitation challenges.
					</p>
					<div class="flex flex-wrap gap-2">
						<span
							class="inline-flex items-center rounded-full border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-orange-600/5 px-3 py-1.5 text-xs font-medium text-orange-400 transition-all hover:border-orange-500/50 hover:bg-orange-500/15"
							>🎯 CTF</span
						>
						<span
							class="inline-flex items-center rounded-full border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-orange-600/5 px-3 py-1.5 text-xs font-medium text-orange-400 transition-all hover:border-orange-500/50 hover:bg-orange-500/15"
							>🔐 Web Security</span
						>
					</div>
				</div>
			</div>

			<!-- Languages -->
			<div class="group skillset md:col-span-1 lg:col-span-3">
				<div class="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-800/50 text-sm sm:h-8 sm:w-8 sm:text-base"
					>
						⌨️
					</div>
					<h3
						class="stack-sans-text text-[10px] font-semibold tracking-wider text-stone-400 uppercase sm:text-xs"
					>
						Languages
					</h3>
				</div>
				<div class="flex flex-wrap gap-1.5">
					<div
						class="flex items-center gap-1.5 rounded-md border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-all hover:border-orange-500/40 hover:shadow-sm"
					>
						<img src="/skills/JS.png" alt="JS" class="h-3.5 w-3.5 object-contain" />JS
					</div>
					<div
						class="flex items-center gap-1.5 rounded-md border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-all hover:border-orange-500/40 hover:shadow-sm"
					>
						<img src="/skills/ts-logo-512.svg" alt="TS" class="h-3.5 w-3.5 object-contain" />TS
					</div>
					<div
						class="flex items-center gap-1.5 rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						<img src="/skills/python.png" alt="Python" class="h-3.5 w-3.5 object-contain" />Python
					</div>
					<div
						class="flex items-center gap-1.5 rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						<img src="/skills/php.png" alt="PHP" class="h-3.5 w-3.5 object-contain" />PHP
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						SQL
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Assembly
					</div>
				</div>
			</div>

			<!-- Frameworks -->
			<div class="group skillset md:col-span-1 lg:col-span-3">
				<div class="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-800/50 text-sm sm:h-8 sm:w-8 sm:text-base"
					>
						🧩
					</div>
					<h3
						class="stack-sans-text text-[10px] font-semibold tracking-wider text-stone-400 uppercase sm:text-xs"
					>
						Frameworks
					</h3>
				</div>
				<div class="flex flex-wrap gap-1.5">
					<div
						class="flex items-center gap-1.5 rounded-md border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-all hover:border-orange-500/40 hover:shadow-sm"
					>
						<img
							src="/skills/svelte.png"
							alt="Svelte"
							class="h-3.5 w-3.5 object-contain"
						/>SvelteKit
					</div>
					<div
						class="flex items-center gap-1.5 rounded-md border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-all hover:border-orange-500/40 hover:shadow-sm"
					>
						<img src="/skills/react.png" alt="React" class="h-3.5 w-3.5 object-contain" />React
					</div>
					<div
						class="flex items-center gap-1.5 rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						<img
							src="/skills/tailwindcss.svg"
							alt="Tailwind"
							class="h-3.5 w-3.5 object-contain"
						/>Tailwind
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Express
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Node.js
					</div>
				</div>
			</div>

			<!-- Design -->
			<div class="group skillset md:col-span-1 lg:col-span-4">
				<div class="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-800/50 text-sm sm:h-8 sm:w-8 sm:text-base"
					>
						🎨
					</div>
					<h3
						class="stack-sans-text text-[10px] font-semibold tracking-wider text-stone-400 uppercase sm:text-xs"
					>
						Design
					</h3>
				</div>
				<div class="flex flex-wrap gap-1.5">
					<div
						class="flex items-center gap-1.5 rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						<img
							src="/skills/photoshop.jpg"
							alt="Ps"
							class="h-3.5 w-3.5 rounded object-cover"
						/>Photoshop
					</div>
					<div
						class="flex items-center gap-1.5 rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						<img
							src="/skills/illustrator.jpg"
							alt="Ai"
							class="h-3.5 w-3.5 rounded object-cover"
						/>Illustrator
					</div>
					<div
						class="flex items-center gap-1.5 rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						<img
							src="/skills/premiere.jpg"
							alt="Pr"
							class="h-3.5 w-3.5 rounded object-cover"
						/>Premiere
					</div>
					<div
						class="flex items-center gap-1.5 rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						<img
							src="/skills/indesign.jpg"
							alt="Id"
							class="h-3.5 w-3.5 rounded object-cover"
						/>InDesign
					</div>
					<div
						class="rounded-md border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-all hover:border-orange-500/40 hover:shadow-sm"
					>
						Affinity
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Figma
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Canva
					</div>
				</div>
			</div>
			<!-- AI & Tools -->
			<div class="group skillset md:col-span-1 lg:col-span-4">
				<div class="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-800/50 text-sm sm:h-8 sm:w-8 sm:text-base"
					>
						🤖
					</div>
					<h3
						class="stack-sans-text text-[10px] font-semibold tracking-wider text-stone-400 uppercase sm:text-xs"
					>
						AI & Tools
					</h3>
				</div>
				<div class="flex flex-wrap gap-1.5">
					<div
						class="rounded-md border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-all hover:border-orange-500/40 hover:shadow-sm"
					>
						OpenAI API
					</div>
					<div
						class="rounded-md border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-all hover:border-orange-500/40 hover:shadow-sm"
					>
						ChatGPT
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Claude
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Lovable.ai
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Cursor
					</div>
				</div>
			</div>

			<!-- DevOps -->
			<div class="group skillset md:col-span-1 lg:col-span-4">
				<div class="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-800/50 text-sm sm:h-8 sm:w-8 sm:text-base"
					>
						🛠️
					</div>
					<h3
						class="stack-sans-text text-[10px] font-semibold tracking-wider text-stone-400 uppercase sm:text-xs"
					>
						DevOps
					</h3>
				</div>
				<div class="flex flex-wrap gap-1.5">
					<div
						class="flex items-center gap-1.5 rounded-md border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-all hover:border-orange-500/40 hover:shadow-sm"
					>
						<img src="/skills/docker.png" alt="Docker" class="h-3.5 w-3.5 object-contain" />Docker
					</div>
					<div
						class="rounded-md border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-all hover:border-orange-500/40 hover:shadow-sm"
					>
						Git
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						GitHub
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Linux
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Nginx
					</div>
				</div>
			</div>

			<!-- Services -->
			<div class="group skillset md:col-span-1 lg:col-span-4">
				<div class="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-800/50 text-sm sm:h-8 sm:w-8 sm:text-base"
					>
						🔌
					</div>
					<h3
						class="stack-sans-text text-[10px] font-semibold tracking-wider text-stone-400 uppercase sm:text-xs"
					>
						Services
					</h3>
				</div>
				<div class="flex flex-wrap gap-1.5">
					<div
						class="rounded-md border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-all hover:border-orange-500/40 hover:shadow-sm"
					>
						Stripe
					</div>
					<div
						class="rounded-md border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-all hover:border-orange-500/40 hover:shadow-sm"
					>
						PayPal
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Firebase
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Supabase
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Vercel
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Pocketbase
					</div>
				</div>
			</div>

			<!-- Databases -->
			<div class="group skillset md:col-span-1 lg:col-span-4">
				<div class="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-800/50 text-sm sm:h-8 sm:w-8 sm:text-base"
					>
						🗄️
					</div>
					<h3
						class="stack-sans-text text-[10px] font-semibold tracking-wider text-stone-400 uppercase sm:text-xs"
					>
						Databases
					</h3>
				</div>
				<div class="flex flex-wrap gap-1.5">
					<div
						class="rounded-md border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-all hover:border-orange-500/40 hover:shadow-sm"
					>
						PostgreSQL
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						MySQL
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						MongoDB
					</div>
					<div
						class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2.5 py-1.5 text-xs text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50"
					>
						Redis
					</div>
				</div>
			</div>

			<!-- Fun card to fill the gap -->
			<div
				class="group rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-stone-900/50 p-3 backdrop-blur-sm transition-all duration-300 hover:border-orange-500/40 sm:rounded-2xl sm:p-4 md:col-span-1 lg:col-span-4"
			>
				<div
					class="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-center sm:gap-3"
				>
					<div class="text-3xl transition-transform duration-300 group-hover:scale-110 sm:text-4xl">
						🚀
					</div>
					<p class="text-xs font-medium text-orange-400 sm:text-sm">Always learning</p>
					<p class="text-xs text-stone-400">More skills incoming...</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Work Experience Section -->
<section class="polka-dot">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
		<!-- Section Header -->
		<div class="mb-8 flex flex-col items-center sm:mb-10 lg:mb-12">
			<Square>
				<Beaker />
			</Square>
			<h2 class="stack-sans-text mt-4 text-2xl text-stone-200 sm:text-3xl lg:text-4xl">
				Work
				<GlowText>experience</GlowText>
			</h2>
		</div>

		<!-- Timeline Layout -->
		<div class="relative">
			<!-- Vertical Line -->
			<div class="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-orange-500/50 via-stone-700 to-transparent md:left-1/2 md:block md:-translate-x-px"></div>

			<!-- Experience Items -->
			<div class="flex flex-col gap-8 md:gap-12">
				
				<!-- Pumplo - Current (Primary) -->
				<div class="relative md:flex md:items-center">
					<!-- Timeline Dot -->
					<div class="absolute left-4 top-0 z-10 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-orange-500 bg-stone-950 md:left-1/2 md:block"></div>
					
					<!-- Content - Right Side -->
					<div class="md:ml-auto md:w-[calc(50%-2rem)] md:pl-8">
						<div class="group rounded-xl border border-orange-500/30 bg-gradient-to-br from-stone-900/95 via-stone-900/90 to-stone-950/95 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/5 sm:p-6">
							<div class="mb-3 flex flex-wrap items-center gap-2">
								<span class="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-400">Current</span>
								<span class="text-xs text-stone-500">2025 - Present</span>
							</div>
							<div class="mb-3 flex items-center gap-3">
								<img src="/pumplo.svg" alt="Pumplo" class="h-10 w-10 rounded-lg bg-stone-800 object-contain p-1" />
								<div>
									<h3 class="stack-sans-text text-lg font-semibold text-stone-100 sm:text-xl">Pumplo</h3>
									<p class="text-sm text-orange-400/90">Freelance Designer & Developer</p>
								</div>
							</div>
							<p class="text-sm leading-relaxed text-stone-400">
								Created a modern design language for pumplo.com and worked on creating an app MVP in a team of five people. Handling both UI/UX design and front-end development.
							</p>
							<div class="mt-4 flex flex-wrap gap-1.5">
								<span class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-1 text-[10px] text-stone-400">UI/UX</span>
								<span class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-1 text-[10px] text-stone-400">Front-end</span>
								<span class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-1 text-[10px] text-stone-400">Graphic Design</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Boostly.sk - Current -->
				<div class="relative md:flex md:items-center">
					<!-- Timeline Dot -->
					<div class="absolute left-4 top-0 z-10 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-orange-500 bg-stone-950 md:left-1/2 md:block"></div>
					
					<!-- Content - Left Side -->
					<div class="md:mr-auto md:w-[calc(50%-2rem)] md:pr-8 md:text-right">
						<div class="group rounded-xl border border-orange-500/30 bg-gradient-to-br from-stone-900/95 via-stone-900/90 to-stone-950/95 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/5 sm:p-6">
							<div class="mb-3 flex flex-wrap items-center gap-2 md:justify-end">
								<span class="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-400">Current</span>
								<span class="text-xs text-stone-500">2025 - Present</span>
							</div>
							<div class="mb-3 flex items-center gap-3 md:flex-row-reverse">
								<img src="/projects/boostly.png" alt="Boostly" class="h-10 w-10 rounded-lg object-cover" />
								<div>
									<h3 class="stack-sans-text text-lg font-semibold text-stone-100 sm:text-xl">Boostly.sk</h3>
									<p class="text-sm text-orange-400/90">Freelance Designer</p>
								</div>
							</div>
							<p class="text-sm leading-relaxed text-stone-400">
								Creating beautiful and eye-catching marketing graphics for clients. Designing social media content, promotional materials, and brand identity elements.
							</p>
							<div class="mt-4 flex flex-wrap gap-1.5 md:justify-end">
								<span class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-1 text-[10px] text-stone-400">Graphic Design</span>
								<span class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-1 text-[10px] text-stone-400">Marketing</span>
								<span class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-1 text-[10px] text-stone-400">Branding</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Terapias de Priscos (Erasmus+) -->
				<div class="relative md:flex md:items-center">
					<!-- Timeline Dot -->
					<div class="absolute left-4 top-0 z-10 hidden h-3 w-3 -translate-x-1/2 rounded-full border-2 border-stone-600 bg-stone-950 md:left-1/2 md:block"></div>
					
					<!-- Content - Right Side -->
					<div class="md:ml-auto md:w-[calc(50%-2rem)] md:pl-8">
						<div class="group relative overflow-hidden rounded-xl border border-stone-800/80 bg-gradient-to-br from-stone-900/70 to-stone-900/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg sm:p-6">
							<!-- Portugal flag gradient accent -->
							<div class="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-10" style="background: linear-gradient(to left, #FF0000 0%, #006600 50%, transparent 100%);"></div>
							
							<div class="relative z-10">
								<div class="mb-3 flex flex-wrap items-center gap-2">
									<span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Erasmus+</span>
									<span class="text-xs text-stone-500">2024</span>
								</div>
								<div class="mb-3 flex items-center gap-3">
									<img src="/projects/terapias.png" alt="Terapias de Priscos" class="h-10 w-10 rounded-lg object-cover" />
									<div>
										<h3 class="stack-sans-text text-lg font-semibold text-stone-100 sm:text-xl">Terapias de Priscos</h3>
										<p class="text-sm text-stone-400">Front-end Developer • Portugal 🇵🇹</p>
									</div>
								</div>
								<p class="text-sm leading-relaxed text-stone-400">
									As part of the Erasmus+ programme, I got the opportunity to work abroad in Portugal as a front-end developer. Gained international experience and collaborated with a diverse team.
								</p>
								<div class="mt-4 flex flex-wrap gap-1.5">
									<span class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-1 text-[10px] text-stone-400">WordPress</span>
									<span class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-1 text-[10px] text-stone-400">Graphic design</span>
									<span class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-1 text-[10px] text-stone-400">International</span>
								</div>
							</div>
						</div>
					</div>
				</div>
		</div>
	</div>
</section>

<!-- Blog Section -->
<section class="bg-stone-950 border-t border-stone-900">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
		<!-- Section Header -->
		<div class="mb-8 flex flex-col items-center sm:mb-10 lg:mb-12">
			<Square>
				<FolderOpen />
			</Square>
			<h2 class="stack-sans-text mt-4 text-2xl text-stone-200 sm:text-3xl lg:text-4xl">
				Latest
				<GlowText>posts</GlowText>
			</h2>
			<p class="mt-2 text-sm text-stone-500">Thoughts, tutorials, and insights</p>
		</div>

		{#if data.posts && data.posts.length > 0}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<!-- Featured Post (Latest) -->
				<a 
					href="/blog/{data.posts[0].slug}" 
					class="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-stone-900/95 via-stone-900/90 to-stone-950/95 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/5 md:col-span-2 lg:col-span-2 lg:row-span-2"
					style="--accent1: {data.posts[0].accent1 || 'rgba(249, 115, 22, 0.15)'}; --accent2: {data.posts[0].accent2 || 'rgba(249, 115, 22, 0.1)'};"
				>
					<!-- Gradient accent background -->
					<div class="pointer-events-none absolute inset-0 opacity-50" style="background: radial-gradient(ellipse at top left, var(--accent1) 0%, transparent 50%), radial-gradient(ellipse at bottom right, var(--accent2) 0%, transparent 50%);"></div>
					
					<div class="relative z-10 flex h-full flex-col">
						<div class="mb-3 flex items-center gap-2">
							<span class="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-400">Latest</span>
							<span class="text-xs text-stone-500">{new Date(data.posts[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
						</div>
						
						<h3 class="stack-sans-text mb-3 text-xl font-semibold text-stone-100 transition-colors group-hover:text-orange-400 sm:text-2xl lg:text-3xl">
							{data.posts[0].title}
						</h3>
						
						<p class="mb-4 flex-grow text-sm leading-relaxed text-stone-400 sm:text-base">
							{data.posts[0].description}
						</p>
						
						<div class="mt-auto flex flex-wrap gap-2">
							{#each data.posts[0].categories.slice(0, 3) as category}
								<span class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-1 text-xs text-stone-400">
									{category}
								</span>
							{/each}
						</div>
						
						<div class="mt-4 flex items-center gap-1 text-sm font-medium text-orange-400 transition-transform group-hover:translate-x-1">
							Read article
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
							</svg>
						</div>
					</div>
				</a>

				<!-- Additional Posts -->
				{#each data.posts.slice(1, 3) as post}
					<a 
						href="/blog/{post.slug}" 
						class="group rounded-xl border border-stone-800/80 bg-gradient-to-br from-stone-900/70 to-stone-900/50 p-4 backdrop-blur-sm transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg sm:p-5"
					>
						<div class="mb-2 text-xs text-stone-500">
							{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
						</div>
						
						<h3 class="stack-sans-text mb-2 text-base font-semibold text-stone-200 transition-colors group-hover:text-orange-400 sm:text-lg">
							{post.title}
						</h3>
						
						<p class="mb-3 line-clamp-2 text-xs text-stone-400 sm:text-sm">
							{post.description}
						</p>
						
						<div class="flex flex-wrap gap-1.5">
							{#each post.categories.slice(0, 2) as category}
								<span class="rounded-md border border-stone-700/80 bg-stone-800/30 px-2 py-0.5 text-[10px] text-stone-500">
									{category}
								</span>
							{/each}
						</div>
					</a>
				{/each}

				<!-- Skeleton placeholders for future posts -->
				{#each Array(Math.max(0, 3 - data.posts.length)) as _}
					<div
						class="relative rounded-xl border border-stone-800/50 border-dashed bg-gradient-to-br from-stone-900/30 to-stone-900/20 p-4 sm:p-5"
					>
						<div class="animate-pulse">
							<div class="mb-2 h-3 w-16 rounded bg-stone-800/50"></div>
							<div class="mb-2 h-5 w-3/4 rounded bg-stone-800/50"></div>
							<div class="mb-1.5 h-3 w-full rounded bg-stone-800/30"></div>
							<div class="mb-3 h-3 w-2/3 rounded bg-stone-800/30"></div>
							<div class="flex gap-1.5">
								<div class="h-4 w-10 rounded-md bg-stone-800/40"></div>
								<div class="h-4 w-12 rounded-md bg-stone-800/40"></div>
							</div>
						</div>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-xs text-stone-600 font-medium">Coming soon</span>
						</div>
					</div>
				{/each}
			</div>
			
			<!-- View All Link -->
			<div class="mt-8 flex justify-center">
				<Anchor href="/blog" type="button" class="group flex items-center gap-2 text-sm">
					View all posts
					<svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
					</svg>
				</Anchor>
			</div>
		{:else}
			<!-- Empty State -->
			<div class="flex flex-col items-center justify-center rounded-2xl border border-stone-800/50 bg-stone-900/30 py-16 text-center">
				<div class="mb-4 text-4xl">📝</div>
				<h3 class="stack-sans-text mb-2 text-lg font-semibold text-stone-300">No posts yet</h3>
				<p class="text-sm text-stone-500">Check back soon for new content!</p>
			</div>
		{/if}
	</div>
</section>

<!-- Contact Section -->
<section id="contact" class="border-t border-stone-900 bg-stone-950">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
		<!-- Section Header -->
		<div class="mb-8 flex flex-col items-center sm:mb-10 lg:mb-12">
			<Square>
				<Link />
			</Square>
			<h2 class="stack-sans-text mt-4 text-2xl text-stone-200 sm:text-3xl lg:text-4xl">
				Get in
				<GlowText>touch</GlowText>
			</h2>
			<p class="mt-2 text-center text-sm text-stone-500">Have a project in mind? Let's make it happen.</p>
		</div>

		<div class="grid gap-6 lg:grid-cols-5 lg:gap-8">
			<!-- Contact Info Side -->
			<div class="flex flex-col gap-4 lg:col-span-2">
				<!-- Quick Info Card -->
				<div class="rounded-2xl border border-stone-800/80 bg-gradient-to-br from-stone-900/70 to-stone-900/50 p-6 backdrop-blur-sm">
					<h3 class="stack-sans-text mb-4 text-lg font-semibold text-stone-100">Let's connect</h3>
					<p class="mb-6 text-sm leading-relaxed text-stone-400">
						Whether you need a website, web application, or just want to chat about tech — I'm always open to new opportunities and collaborations.
					</p>
					
					<div class="flex flex-col gap-4">
						<!-- Email -->
						<a href="mailto:em1t.dev@proton.me" class="group flex items-center gap-3 rounded-xl border border-stone-700/80 bg-stone-800/30 p-3 transition-all hover:border-orange-500/30 hover:bg-stone-800/50">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400">
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
								</svg>
							</div>
							<div>
								<p class="text-xs text-stone-500">Email</p>
								<p class="text-sm font-medium text-stone-200 transition-colors group-hover:text-orange-400">em1t.dev@proton.me</p>
							</div>
						</a>
						
						<!-- GitHub -->
						<a href="https://github.com/Em1tt" target="_blank" rel="noopener noreferrer" class="group flex items-center gap-3 rounded-xl border border-stone-700/80 bg-stone-800/30 p-3 transition-all hover:border-orange-500/30 hover:bg-stone-800/50">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-stone-700/50 to-stone-800/50 text-stone-300">
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
								</svg>
							</div>
							<div>
								<p class="text-xs text-stone-500">GitHub</p>
								<p class="text-sm font-medium text-stone-200 transition-colors group-hover:text-orange-400">@Em1tt</p>
							</div>
						</a>

						<!-- LinkedIn -->
						<a href="https://www.linkedin.com/in/richard-marcincak/" target="_blank" rel="noopener noreferrer" class="group flex items-center gap-3 rounded-xl border border-stone-700/80 bg-stone-800/30 p-3 transition-all hover:border-orange-500/30 hover:bg-stone-800/50">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400">
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
									<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
								</svg>
							</div>
							<div>
								<p class="text-xs text-stone-500">LinkedIn</p>
								<p class="text-sm font-medium text-stone-200 transition-colors group-hover:text-orange-400">Richard Marcincak</p>
							</div>
						</a>
					</div>
				</div>

				<!-- Availability Card -->
				<div class="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-stone-900/50 p-5">
					<div class="flex items-center gap-3">
						<div class="relative">
							<div class="h-3 w-3 rounded-full bg-emerald-500"></div>
							<div class="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-emerald-500 opacity-75"></div>
						</div>
						<div>
							<p class="text-sm font-medium text-emerald-400">Available for work</p>
							<p class="text-xs text-stone-500">Currently accepting new projects</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Contact Form -->
			<div class="lg:col-span-3">
				<form
					use:enhance={() => {
						loading = toast.loading('Sending message...');
						return async ({ result }) => {
							toast.dismiss(loading);
							if (result.type == 'success') {
								toast.success('Message sent successfully! I\'ll get back to you soon.');
							} else if (result.type == 'failure') {
								if (result.data?.validation) {
									toast.error('Please fill in all required fields.');
								} else if (result.data?.captcha) {
									toast.error('Captcha validation failed. Refresh the page and try again.');
								} else {
									toast.error('An error occurred. Please try again later.');
								}
							}
						};
					}}
					method="post"
					action="?/contact"
					class="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-stone-900/95 via-stone-900/90 to-stone-950/95 p-6 shadow-lg backdrop-blur-sm sm:p-8"
				>
					<h3 class="stack-sans-text mb-6 text-xl font-semibold text-stone-100">Send me a message</h3>
					
					<div class="grid gap-5 sm:grid-cols-2">
						<!-- Name Field -->
						<div>
							<input
								type="text"
								id="name"
								name="name"
								required
								placeholder="Your name *"
								class="w-full rounded-lg border border-stone-700/80 bg-stone-800/30 px-4 py-3 text-sm text-stone-200 placeholder-stone-500 outline-none transition-all focus:border-orange-500/50 focus:bg-stone-800/50 focus:ring-1 focus:ring-orange-500/20"
							/>
						</div>

						<!-- Email Field -->
						<div>
							<input
								type="email"
								id="email"
								name="email"
								required
								placeholder="Email address *"
								class="w-full rounded-lg border border-stone-700/80 bg-stone-800/30 px-4 py-3 text-sm text-stone-200 placeholder-stone-500 outline-none transition-all focus:border-orange-500/50 focus:bg-stone-800/50 focus:ring-1 focus:ring-orange-500/20"
							/>
						</div>
					</div>

					<!-- Subject Field -->
					<div class="mt-5">
						<input
							type="text"
							id="subject"
							name="subject"
							required
							placeholder="Subject *"
							class="w-full rounded-lg border border-stone-700/80 bg-stone-800/30 px-4 py-3 text-sm text-stone-200 placeholder-stone-500 outline-none transition-all focus:border-orange-500/50 focus:bg-stone-800/50 focus:ring-1 focus:ring-orange-500/20"
						/>
					</div>

					<!-- Project Type (New addition) -->
					<div class="mt-5">
						<p class="mb-2 text-sm text-stone-400">What are you looking for?</p>
						<div class="flex flex-wrap gap-2">
							<label class="cursor-pointer">
								<input type="radio" name="project_type" value="website" class="peer sr-only" />
								<span class="inline-block rounded-lg border border-stone-700/80 bg-stone-800/30 px-3 py-1.5 text-xs text-stone-400 transition-all peer-checked:border-orange-500/50 peer-checked:bg-orange-500/10 peer-checked:text-orange-400 hover:border-stone-600 hover:bg-stone-800/50">🌐 Website</span>
							</label>
							<label class="cursor-pointer">
								<input type="radio" name="project_type" value="webapp" class="peer sr-only" />
								<span class="inline-block rounded-lg border border-stone-700/80 bg-stone-800/30 px-3 py-1.5 text-xs text-stone-400 transition-all peer-checked:border-orange-500/50 peer-checked:bg-orange-500/10 peer-checked:text-orange-400 hover:border-stone-600 hover:bg-stone-800/50">💻 Web App</span>
							</label>
							<label class="cursor-pointer">
								<input type="radio" name="project_type" value="design" class="peer sr-only" />
								<span class="inline-block rounded-lg border border-stone-700/80 bg-stone-800/30 px-3 py-1.5 text-xs text-stone-400 transition-all peer-checked:border-orange-500/50 peer-checked:bg-orange-500/10 peer-checked:text-orange-400 hover:border-stone-600 hover:bg-stone-800/50">🎨 Design</span>
							</label>
							<label class="cursor-pointer">
								<input type="radio" name="project_type" value="consulting" class="peer sr-only" />
								<span class="inline-block rounded-lg border border-stone-700/80 bg-stone-800/30 px-3 py-1.5 text-xs text-stone-400 transition-all peer-checked:border-orange-500/50 peer-checked:bg-orange-500/10 peer-checked:text-orange-400 hover:border-stone-600 hover:bg-stone-800/50">💡 Consulting</span>
							</label>
							<label class="cursor-pointer">
								<input type="radio" name="project_type" value="other" class="peer sr-only" checked />
								<span class="inline-block rounded-lg border border-stone-700/80 bg-stone-800/30 px-3 py-1.5 text-xs text-stone-400 transition-all peer-checked:border-orange-500/50 peer-checked:bg-orange-500/10 peer-checked:text-orange-400 hover:border-stone-600 hover:bg-stone-800/50">✨ Other</span>
							</label>
						</div>
					</div>

					<!-- Message Field -->
					<div class="mt-5">
						<textarea
							id="content"
							name="content"
							required
							rows="4"
							placeholder="Tell me about your project *"
							class="w-full resize-none rounded-lg border border-stone-700/80 bg-stone-800/30 px-4 py-3 text-sm text-stone-200 placeholder-stone-500 outline-none transition-all focus:border-orange-500/50 focus:bg-stone-800/50 focus:ring-1 focus:ring-orange-500/20"
						></textarea>
					</div>

					<Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} size="invisible" />

					<!-- Submit Button -->
					<button
						type="submit"
						class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-800 bg-gradient-to-tr from-transparent to-stone-800/75 px-5 py-2.5 text-stone-300 backdrop-blur-md transition-all hover:border-transparent hover:bg-none hover:bg-white hover:text-stone-900 hover:[box-shadow:0_0_50px_-15px_white] hover:shadow-white/25"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
						</svg>
						Send Message
					</button>
				</form>
			</div>
		</div>
	</div>
</section>



<!-- Footer -->
<footer class="border-t border-stone-900 bg-stone-950 py-8">
	<div class="mx-auto max-w-7xl px-4 sm:px-6">
		<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
			<div class="flex items-center gap-2">
				<img src="/misc/E1.svg" width="24" alt="Em1t logo" />
				<span class="text-sm text-stone-500">© {new Date().getFullYear()} Em1t. All rights reserved.</span>
			</div>
			<div class="flex items-center gap-4">
				<a href="https://github.com/Em1tt" target="_blank" rel="noopener noreferrer" class="text-stone-500 transition-colors hover:text-orange-400">
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
					</svg>
				</a>
				<a href="mailto:em1t.dev@proton.me" class="text-stone-500 transition-colors hover:text-orange-400">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
					</svg>
				</a>
			</div>
		</div>
	</div>
</footer>

<style lang="postcss">
	@reference "tailwindcss";

	.dummy {
	} /*For some reason the next classes won't load without this*/

	.polka-dot {
		position: relative;
		--dot-bg: oklch(14.7% 0.004 49.25);
		--dot-color: oklch(70.09% 0.20117 44.755 / 0.205);
		--dot-size: 1px;
		--dot-space: 20px;
		background:
			linear-gradient(90deg, var(--dot-bg) calc(var(--dot-space) - var(--dot-size)), transparent 1%)
				center / var(--dot-space) var(--dot-space),
			linear-gradient(var(--dot-bg) calc(var(--dot-space) - var(--dot-size)), transparent 1%)
				center / var(--dot-space) var(--dot-space),
			var(--dot-color);
	}
	.skillset {
		@apply rounded-xl border border-stone-800/80 bg-gradient-to-br from-stone-900/70 to-stone-950/30 p-3 backdrop-blur-lg transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg sm:rounded-2xl sm:p-4;
	}
</style>
