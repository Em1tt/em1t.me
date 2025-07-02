<script lang="ts">
	import PageTransition from '../transition.svelte'
	// ...
	let { children, data } = $props()
</script>

<div class="polka fixed top-0 left-0 -z-10 h-screen w-screen">
	<div id="radialGradient"></div>
	<div id="radialGradient2"></div>
</div>

<main>
	<PageTransition url={data.url}>
		{@render children?.()}
	</PageTransition>
</main>

<div class="fixed top-4 right-4 z-40">
	<img src="/misc/E1blog.svg" alt="E1" width="64" />
</div>

<style lang="postcss">
	@reference "../../app.css";

	:root{
		--accent1: rgba(233, 14, 80, 0.123);
		--accent2: rgba(14, 164, 233, 0.123);
	}

	:global(#sections) {
		display: none;
	}
	:global(#sections + ul) {
		display: none;
	}
	#radialGradient {
		/*z-index: 2;
	background-image: radial-gradient(circle, rgba(255, 154, 250, 0.089) 0%, rgba(0, 0, 0, 0.664) 100%);
	position: absolute;
	pointer-events: none;
	width: 100%;
	height: 100%;*/
		z-index: 3;
		background-image: radial-gradient(
			ellipse 150% 100% at top center,
			var(--accent1) 0%,
			rgba(0, 0, 0, 0.089) 40%
		);
		position: absolute;
		pointer-events: none;
		width: 100vw;
		height: 100vh;
	}
	#radialGradient2 {
		z-index: 3;
		background-image: radial-gradient(
			ellipse 150% 100% at bottom center,
			var(--accent2) 0%,
			rgba(0, 0, 0, 0.089) 40%
		);
		position: absolute;
		pointer-events: none;
		width: 100vw;
		height: 100vh;
	}
	.polka {
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
</style>
