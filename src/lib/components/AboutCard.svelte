<script lang="ts">
	import type { Snippet } from 'svelte';

	type AnchorProps = {
		children?: Snippet;
		noPadding?: boolean;
		color?: 'white' | 'orange';
	};

	const props: AnchorProps = $props();

	const { children, noPadding, color } = props;

	const isWhite = $derived(color === 'white');
</script>

<!-- 
  Safelist for Tailwind purging (do not remove):
  from-white/5 from-white/50 from-orange-500/5 from-orange-500/50
-->
<div class="relative isolate">
	<!-- Border gradient (bottom layer) -->
	<div
		class="absolute -top-[1px] -left-[1px] -z-20 h-[calc(100%+2px)] w-[calc(100%+2px)] rounded-lg bg-gradient-to-br via-stone-800/50 via-10% to-60% to-transparent {isWhite ? 'from-white/50' : 'from-orange-500/50'}"
	></div>
	<!-- Content (middle layer) -->
	<div class="relative z-0 rounded-lg bg-stone-950 {noPadding ? '' : 'p-6'}">
		{@render children?.()}
	</div>
	<!-- Glow overlay (top layer) -->
	<div
		class="pointer-events-none absolute -top-[1px] -left-[1px] z-10 h-full w-[calc(100%+2px)] rounded-lg bg-gradient-to-br via-transparent via-50% to-transparent {isWhite ? 'from-white/5' : 'from-orange-500/5'}"
	></div>
</div>
