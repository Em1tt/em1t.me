<script lang="ts">
	import Dissolve from '$lib/components/Dissolve.svelte';
	import SectionLabel from '$lib/components/SectionLabel.svelte';

	const credits = [
		{ role: 'Full-stack engineer, freelance', name: 'Qaxal, s.r.o.', years: '2026–' },
		{ role: 'Design language & app MVP', name: 'Pumplo', years: '2025–26' },
		{ role: 'Social & print graphics', name: 'Boostly.sk', years: '2025–26' },
		{ role: 'Front-end developer, Erasmus+', name: 'Terapias de Priscos, Portugal', years: '2024' },
		{ role: 'Web exploitation', name: 'Slovak Cyber Team' }
	];

	const tools = [
		'SvelteKit',
		'React',
		'TypeScript',
		'Node',
		'Express',
		'PHP',
		'Python',
		'PostgreSQL',
		'Docker',
		'Figma',
		'Affinity',
		'Photoshop',
		'Illustrator',
		'InDesign',
		'Burp Suite'
	];
</script>

<section
	id="what-i-do"
	class="grid min-h-dvh w-full bg-[#05030f] text-slate-200 md:grid-cols-[minmax(0,26fr)_minmax(0,74fr)]"
>
	<!-- The print is its own layer so it can hang below the section, and it comes apart over the
	     work below rather than stopping on a line. Keep bg-[40%_50%] and Dissolve's position in
	     step, or the dissolve's grid slides off the dots it is painting over. -->
	<div class="relative min-h-44 sm:min-h-56">
		<div
			class="absolute inset-x-0 top-0 bottom-0 bg-[url('/bg4.png')] bg-cover bg-[40%_50%] bg-no-repeat md:-bottom-[clamp(150px,22vh,280px)]"
		>
			<Dissolve art="/bg4.png" position={0.4} />
		</div>
		<div
			class="absolute top-[clamp(20px,6vh,72px)] left-4 z-1 md:top-[clamp(24px,6vh,72px)] md:left-[clamp(16px,2.4vw,40px)]"
		>
			<SectionLabel>What I do</SectionLabel>
		</div>
		<p
			class="google-sans-500 absolute bottom-5 left-4 z-1 text-[clamp(18px,2vw,34px)] leading-[1.2] md:bottom-[clamp(24px,6vh,72px)] md:left-[clamp(16px,2.4vw,40px)] md:rotate-180 md:[writing-mode:vertical-rl]"
		>
			<span
				class="bg-[#05030f] box-decoration-clone px-[0.42em] py-[0.16em] md:px-[0.16em] md:py-[0.42em]"
				>Developer · Designer · CTF player</span
			>
		</p>
	</div>
	<div
		class="flex flex-col justify-center gap-[clamp(20px,3.4vh,36px)] px-4 py-10 md:px-10 md:py-[clamp(24px,6vh,72px)] lg:px-20"
	>
		<h2
			class="google-sans-500 max-w-[17em] text-[clamp(28px,3vw,52px)] leading-[1.08] tracking-tight text-balance"
		>
			I design and build for the web, then try to break it.
		</h2>
		<!-- Side by side from md up. Below that each credit is one block, or the row gap would space
		     a role as far from its own name as from the next one. -->
		<dl
			class="grid gap-x-7 gap-y-[clamp(14px,2vh,20px)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-y-[clamp(6px,1.3vh,14px)]"
		>
			{#each credits as credit (credit.name)}
				<div class="md:contents">
					<dt
						class="google-sans-code-500 text-[11px] leading-snug tracking-[0.08em] text-slate-400 uppercase md:pt-[0.72em] md:text-right"
					>
						{credit.role}
					</dt>
					<dd
						class="google-sans-500 text-[clamp(20px,1.9vw,32px)] leading-[1.2] tracking-[-0.012em]"
					>
						{credit.name}{#if credit.years}<span
								class="google-sans-code-400 ml-2 align-[0.3em] text-[13px] tracking-normal text-[#ff5640]"
								>{credit.years}</span
							>{/if}
					</dd>
				</div>
			{/each}
		</dl>
		<p class="google-sans-code-400 max-w-[72ch] text-[13px] leading-[1.8] text-slate-400">
			<span class="google-sans-code-500 mr-[1ch] text-[#ff5640]">Tools</span>{tools.join(' / ')}
		</p>
	</div>
</section>
