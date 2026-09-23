<script lang="ts">
	import { resolve } from '$app/paths';
	import SectionLabel from '$lib/components/SectionLabel.svelte';
	import { caseStudies, projects, type Project } from '$lib/projects';

	// Newest first: the lead gets the big plate, the next one sits above a pair of small ones.
	// On wide screens the section is exactly one screen tall and the plates shrink to fit it:
	// with mandatory snapping, a section even a little taller than the screen eats a wheel tick.
	const [lead, second, ...pair] = caseStudies;
	const others = projects.filter((project) => !project.caseStudy);
</script>

{#snippet plate(project: Project, size: 'big' | 'mid' | 'small')}
	<figure>
		<a href={resolve('/work/[slug]', { slug: project.slug })} class="group block">
			<div class="relative">
				<img
					src={project.cover}
					alt=""
					width="1600"
					height="1066"
					loading="lazy"
					class={[
						'w-full bg-[#05030f] object-cover',
						size === 'big' ? 'aspect-[3/2]' : 'aspect-[16/9]',
						size === 'big' && 'lg:max-h-[calc(100cqh-2.5rem)]',
						size === 'mid' && 'lg:max-h-[calc((100cqh-7.5rem)*2/3)]',
						size === 'small' && 'lg:max-h-[calc((100cqh-7.5rem)/3)]'
					]}
				/>
				{#if project.current}
					<span
						class="google-sans-code-500 absolute top-0 left-0 bg-[#a91a06] px-[0.7em] py-[0.6em] text-[11px] leading-none tracking-[0.08em] text-white uppercase"
						>Now · {project.short}</span
					>
				{/if}
				<span
					class={[
						'google-sans-500 absolute bottom-0 left-0 bg-[#05030f] px-[0.45em] pt-[0.2em] pb-[0.24em] leading-[1.1] tracking-[-0.02em] transition-colors group-hover:bg-[#a91a06] group-hover:text-white motion-reduce:transition-none',
						size === 'big' && 'text-[clamp(26px,2.6vw,44px)]',
						size === 'mid' && 'text-[clamp(22px,2vw,36px)]',
						size === 'small' && 'text-[clamp(18px,1.4vw,24px)]'
					]}>{project.name}</span
				>
			</div>
		</a>
		<figcaption
			class="google-sans-code-400 mt-2.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs leading-normal text-slate-400"
		>
			<span>{project.type}{project.years && size !== 'small' ? ` · ${project.years}` : ''}</span>
			<b
				class="google-sans-code-500 text-[11px] tracking-[0.06em] whitespace-nowrap text-[#ff5640] uppercase"
				>Case study →</b
			>
		</figcaption>
	</figure>
{/snippet}

<section
	id="work"
	class="min-h-dvh w-full snap-start bg-[#05030f] px-4 text-slate-200 md:px-10 lg:px-20"
>
	<div
		class="mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 gap-x-[clamp(20px,2.4vw,40px)] gap-y-4 py-[clamp(24px,6vh,72px)] lg:h-dvh lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-[auto_minmax(0,1fr)_auto]"
	>
		<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2.5 lg:col-span-2">
			<SectionLabel>Selected work</SectionLabel>
			<p class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<span class="google-sans-code-500 text-[11px] tracking-[0.08em] text-[#ff5640] uppercase"
					>Currently</span
				>
				<span class="google-sans-400 text-[clamp(16px,1.2vw,20px)] text-slate-200"
					>Full-stack engineer at <b class="google-sans-600">Qaxal, s.r.o.</b></span
				>
				<span class="google-sans-code-400 text-xs text-slate-400">freelance · 2026–</span>
			</p>
		</div>
		<div class="lg:[container-type:size]">
			{@render plate(lead, 'big')}
		</div>
		<div class="flex flex-col gap-[clamp(14px,2vh,24px)] lg:[container-type:size]">
			{#if second}
				{@render plate(second, 'mid')}
			{/if}
			{#if pair.length}
				<div class="grid grid-cols-2 gap-[clamp(12px,1.4vw,20px)]">
					{#each pair.slice(0, 2) as project (project.slug)}
						{@render plate(project, 'small')}
					{/each}
				</div>
			{/if}
		</div>
		<p
			class="flex flex-wrap items-baseline gap-x-4.5 gap-y-1.5 border-t border-slate-400/20 pt-3.5 text-[clamp(16px,1.2vw,20px)] lg:col-span-2"
		>
			<span class="google-sans-code-500 mr-1.5 text-xs tracking-[0.08em] text-slate-400 uppercase"
				>Also</span
			>
			{#each others as project (project.slug)}
				{#if project.page}
					<a
						href={resolve('/work/[slug]', { slug: project.slug })}
						class="google-sans-400 text-slate-300 underline decoration-slate-600 underline-offset-4 hover:text-white hover:decoration-[#ff5640]"
						>{project.name}<i class="google-sans-code-400 ml-1.5 text-xs text-slate-500 not-italic"
							>{project.short}</i
						></a
					>
				{:else if project.href}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- external repository links -->
					<a
						href={project.href}
						class="google-sans-400 text-slate-300 underline decoration-slate-600 underline-offset-4 hover:text-white hover:decoration-[#ff5640]"
						>{project.name}<i class="google-sans-code-400 ml-1.5 text-xs text-slate-500 not-italic"
							>{project.short}</i
						></a
					>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{:else}
					<span class="google-sans-400 text-slate-300"
						>{project.name}<i class="google-sans-code-400 ml-1.5 text-xs text-slate-500 not-italic"
							>{project.short}</i
						></span
					>
				{/if}
			{/each}
		</p>
	</div>
</section>
