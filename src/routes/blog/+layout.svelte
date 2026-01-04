<script lang="ts">
	import Header from '$lib/Header.svelte';
	import PageTransition from '../transition.svelte'
	let { children, data } = $props()
</script>

<!-- Background with grid pattern and radial gradients -->
<div class="fixed inset-0 -z-10 bg-stone-950">
	<!-- Grid pattern background -->
	<div class="absolute inset-0 bg-[url('/grid.svg')] mask-radial-from-0 mask-radial-to-75% mask-radial-at-top bg-size-[16px] mask-alpha opacity-50"></div>
	<div class="absolute inset-0 bg-[url('/plus-pattern-center.png')] mask-radial-from-0 mask-radial-to-75% mask-radial-at-top bg-size-[64px] mask-alpha opacity-6"></div>
	
	<!-- Radial gradients for accent colors -->
	<div id="radialGradient"></div>
	<div id="radialGradient2"></div>
</div>

<Header />

<main class="relative">
	<PageTransition url={data.url}>
		{@render children?.()}
	</PageTransition>
</main>

<style lang="postcss">
	@reference "../../app.css";

	:root {
		--accent1: rgba(249, 116, 22, 0.124);
		--accent2: rgba(249, 116, 22, 0.056);
	}

	:global(#sections) {
		display: none;
	}
	:global(#sections + ul) {
		display: none;
	}

	#radialGradient {
		z-index: 3;
		background-image: radial-gradient(
			ellipse 150% 80% at top center,
			var(--accent1) 0%,
			transparent 50%
		);
		position: absolute;
		pointer-events: none;
		width: 100vw;
		height: 100vh;
	}

	#radialGradient2 {
		z-index: 3;
		background-image: radial-gradient(
			ellipse 150% 80% at bottom center,
			var(--accent2) 0%,
			transparent 50%
		);
		position: absolute;
		pointer-events: none;
		width: 100vw;
		height: 100vh;
	}
</style>
