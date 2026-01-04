<script>
	import Anchor from "./components/Anchor.svelte";

	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}
</script>

<section
	class="fixed top-0 left-0 z-50 w-full border-b border-stone-800 bg-stone-950/50 py-3 backdrop-blur-md"
>
	<div class="mx-auto flex max-w-7xl flex-col px-4 sm:px-6">
		<div class="flex flex-row items-center justify-between">
			<a href="/" class="flex-shrink-0 w-24">
				<img src="/misc/E1.svg" width="32" alt="Em1t logo" />
			</a>
			<!-- Desktop Navigation -->
			<div class="hidden flex-row justify-center gap-4 md:flex">
				<Anchor href="/blog">Blog</Anchor>
				<Anchor href="/#about">About</Anchor>
				<Anchor href="/#expertise">Expertise</Anchor>
				<Anchor href="/#experience">Experience</Anchor>
			</div>
			<div class="hidden md:block">
				<Anchor type="button" href="/#contact">Contact</Anchor>
			</div>
			<!-- Mobile Hamburger Button -->
			<button
				onclick={toggleMenu}
				class="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-700/80 bg-stone-800/30 text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/50 md:hidden"
				aria-label="Toggle menu"
				aria-expanded={menuOpen}
			>
				{#if menuOpen}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
					</svg>
				{/if}
			</button>
		</div>
	</div>
</section>

<!-- Mobile Sidebar Overlay -->
{#if menuOpen}
	<button
		class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
		onclick={closeMenu}
		aria-label="Close menu"
	></button>
{/if}

<!-- Mobile Sidebar -->
<aside
	class="fixed top-0 right-0 z-50 h-full w-72 max-w-[80vw] transform border-l border-stone-800 bg-stone-950/95 backdrop-blur-md transition-transform duration-300 ease-in-out md:hidden {menuOpen ? 'translate-x-0' : 'translate-x-full'}"
>
	<div class="flex h-full flex-col">
		<!-- Sidebar Header -->
		<div class="flex items-center justify-between border-b border-stone-800 px-6 py-4">
			<span class="text-sm font-medium text-stone-400">Menu</span>
			<button
				onclick={closeMenu}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-800/50 hover:text-stone-200"
				aria-label="Close menu"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Sidebar Navigation -->
		<nav class="flex flex-1 flex-col gap-1 px-4 py-4">
			<a
				href="/blog"
				onclick={closeMenu}
				class="rounded-lg px-4 py-3 text-sm font-medium text-stone-300 transition-all hover:bg-stone-800/50 hover:text-orange-400"
			>
				Blog
			</a>
			<a
				href="/#about"
				onclick={closeMenu}
				class="rounded-lg px-4 py-3 text-sm font-medium text-stone-300 transition-all hover:bg-stone-800/50 hover:text-orange-400"
			>
				About
			</a>
			<a
				href="/#expertise"
				onclick={closeMenu}
				class="rounded-lg px-4 py-3 text-sm font-medium text-stone-300 transition-all hover:bg-stone-800/50 hover:text-orange-400"
			>
				Expertise
			</a>
			<a
				href="/#experience"
				onclick={closeMenu}
				class="rounded-lg px-4 py-3 text-sm font-medium text-stone-300 transition-all hover:bg-stone-800/50 hover:text-orange-400"
			>
				Experience
			</a>
		</nav>

		<!-- Sidebar Footer -->
		<div class="border-t border-stone-800 px-4 py-4">
			<a
				href="/#contact"
				onclick={closeMenu}
				class="flex w-full items-center justify-center rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-orange-600/5 px-4 py-3 text-sm font-medium text-orange-400 transition-all hover:border-orange-500/50 hover:bg-orange-500/15"
			>
				Contact me
			</a>
		</div>
	</div>
</aside>