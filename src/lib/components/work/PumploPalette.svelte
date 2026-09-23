<!-- Pumplo's palette before and after the "Color changes" commit, plus two of its mascots. -->
<script lang="ts">
	const palettes = [
		{
			label: 'colorPalette.png · 26 Sep 2025',
			colors: [
				['Periwinkle', '#C0BFFF'],
				['Sandy brown', '#FFA66C'],
				['Tiffany', '#84E7DD'],
				['Night', '#0E0E0E'],
				['Anti-flash', '#EEEEEE']
			]
		},
		{
			label: '"Color changes" · 1 Oct 2025',
			colors: [
				['Periwinkle', '#6562FF'],
				['Sandy', '#FF812E'],
				['Tiffany', '#45EE91'],
				['Night', '#0E0E0E'],
				['Anti-flash', '#EEEEEE']
			]
		}
	];
</script>

<figure class="my-9 grid gap-6">
	{#each palettes as palette (palette.label)}
		<div class="grid gap-2">
			<p class="google-sans-code-500 text-[11px] tracking-[0.08em] text-slate-400 uppercase">
				{palette.label}
			</p>
			<ul class="grid grid-cols-5 border border-slate-400/20">
				{#each palette.colors as [name, hex] (name)}
					<li class="grid">
						<span class="h-16" style:background-color={hex}></span>
						<span
							class="google-sans-code-400 bg-[#0c0a1a] px-2 py-1.5 text-[11px] leading-snug text-slate-300"
							>{name}<br /><span class="text-slate-500">{hex}</span></span
						>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
	<div class="flex flex-wrap items-end gap-6">
		<img
			src="/work/pumplo-pumpik.svg"
			alt="Pumpík, a bear with a headband and a dumbbell"
			class="h-40 w-auto"
		/>
		<img src="/work/pumplo-lemur.svg" alt="The lemur mascot" class="h-36 w-auto" />
	</div>
	<figcaption class="google-sans-code-400 max-w-[60ch] text-xs leading-relaxed text-slate-400">
		Both palettes and both mascots are from the Pumplo repository. The second palette is what the
		first landing page shipped with, set in Rubik.
	</figcaption>
</figure>
