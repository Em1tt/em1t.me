<!-- Boostly's highlight covers and profile picture, each under the tile of the gradient it was cut from. -->
<script lang="ts">
	const tiles = [
		{ src: '/work/boostly/cover-reels.webp', label: 'Reels' },
		{ src: '/work/boostly/cover-bts.webp', label: 'BTS', note: 'behind the scenes' },
		{ src: '/work/boostly/cover-results.webp', label: 'Výsledky', note: 'results' },
		{ src: '/work/boostly/cover-reviews.webp', label: 'Recenzie', note: 'reviews' },
		{ src: '/work/boostly/profile-picture.webp', label: 'Profile picture' }
	];
</script>

<figure class="my-9 grid gap-4">
	<img
		src="/work/boostly/profile-strip.webp"
		alt="A blue gradient on black, 2560 by 512 pixels"
		width="2560"
		height="512"
		class="aspect-5/1 w-full border border-slate-400/20"
	/>
	<ol class="grid grid-cols-5 gap-[clamp(6px,1.2vw,16px)]">
		{#each tiles as tile (tile.src)}
			<li class="grid justify-items-center gap-2 text-center">
				<img
					src={tile.src}
					alt="{tile.label} cover"
					width="512"
					height="512"
					loading="lazy"
					class="aspect-square w-[90%] rounded-full outline-2 outline-offset-[3px] outline-slate-500/60"
				/>
				<span class="google-sans-code-400 text-[11px] leading-snug text-slate-300"
					>{tile.label}{#if tile.note}<br /><span class="text-slate-500">{tile.note}</span
						>{/if}</span
				>
			</li>
		{/each}
	</ol>
	<figcaption class="google-sans-code-400 max-w-[60ch] text-xs leading-relaxed text-slate-400">
		The gradient, and below it each cover, cropped to a circle as Instagram shows it.
	</figcaption>
</figure>
