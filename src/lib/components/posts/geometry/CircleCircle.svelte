<!-- Circle vs circle, on the same playground as the home page, with the test beside it. -->
<script lang="ts">
	import CollisionPlayground from '$lib/components/CollisionPlayground.svelte';

	let reading = $state<{ distance: number; reach: number; hit: boolean }>();
</script>

<figure class="demo">
	<div
		class="relative aspect-[16/7] overflow-hidden border border-slate-400/20 bg-[#05030f]"
		role="group"
		aria-label="Two circles; drag either one into the other"
	>
		<CollisionPlayground bind:reading />
	</div>
	<figcaption class="google-sans-code-400 mt-2 text-xs leading-relaxed text-slate-400">
		Drag either circle. Left alone, the small one orbits the big one.
		{#if reading}
			<output class="text-slate-200"
				>d = {reading.distance}
				{reading.hit ? '≤' : '>'} r₁ + r₂ = {reading.reach} → {reading.hit
					? 'collision'
					: 'apart'}</output
			>
		{/if}
	</figcaption>
</figure>
