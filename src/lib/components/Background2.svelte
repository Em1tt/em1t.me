<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { sineIn, sineInOut, sineOut } from 'svelte/easing';
	import Scramble from '$lib/Scramble.svelte';
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
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
	onclick={pulse}
	id="background-wrapper"
	class="absolute top-0 left-0 grid h-screen w-screen place-items-center overflow-hidden bg-stone-950"
>
	<div bind:this={background} id="container">
		<!--Background-->
		{#each Array.from({ length: 1600 }, (_, i) => i) as i}
			<div
				class="border border-solid border-white/5 duration-1000 hover:bg-orange-500/50 hover:duration-0"
			></div>
		{/each}
	</div>
	<div id="radialGradient"></div>
</section>

<style>
    .test{}
    #container {
		z-index: 0;
		@apply absolute -top-[30rem] -left-[40rem] grid aspect-square w-[180rem] grid-cols-40 grid-rows-40;
		transform: rotateX(50deg) rotateY(-5deg) rotateZ(20deg);
	}
	#container::before {
		content: ' ';
		z-index: 1;
		@apply pointer-events-none absolute -top-[30rem] -left-[40rem] grid aspect-square w-[180rem] grid-cols-40 grid-rows-40 bg-repeat opacity-10;
		background-image: url('/plus-pattern-center.png');
		background-size: 5%;
		background-position: -8px -24px;
	}
	#radialGradient {
		z-index: 2;
		background-image: radial-gradient(circle, rgba(255, 145, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
		position: absolute;
		pointer-events: none;
		width: 100%;
		height: 100%;
	}
</style>