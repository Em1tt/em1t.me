<script lang="ts">
	import { resolve } from '$app/paths';
	import SectionLabel from '$lib/components/SectionLabel.svelte';
	import { caseStudies, projects, type Project } from '$lib/projects';

	// Newest first: the lead gets the big plate, the other four sit beside it, two by two.
	// On wide screens the section is exactly one screen tall and the plates shrink to fit it:
	// with mandatory snapping, a section even a little taller than the screen eats a wheel tick.
	const [lead, ...rest] = caseStudies;
	const others = projects.filter((project) => !project.caseStudy);
</script>

{#snippet plate(project: Project, big: boolean)}
	<!-- On wide screens a small plate spans an image row and a caption row of the grid beside the
	     lead, so plates side by side keep level images even when one caption wraps. -->
	<figure
		class={big
			? 'lg:flex lg:h-full lg:flex-col'
			: 'lg:row-span-2 lg:grid lg:grid-rows-subgrid lg:nth-[n+3]:row-start-4'}
	>
		<a
			href={resolve('/work/[slug]', { slug: project.slug })}
			class="group block lg:min-h-0 lg:flex-1"
		>
			<div class="relative lg:h-full">
				<img
					src={project.cover}
					alt=""
					width="1600"
					height="1066"
					loading="lazy"
					class={[
						'w-full bg-[#05030f] object-cover lg:aspect-auto lg:h-full',
						big ? 'aspect-[3/2]' : 'aspect-[16/9]'
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
						big ? 'text-[clamp(26px,2.6vw,44px)]' : 'text-[clamp(18px,1.4vw,24px)]'
					]}>{project.name}</span
				>
			</div>
		</a>
		<figcaption
			class="google-sans-code-400 mt-2.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs leading-normal text-slate-400"
		>
			<span>{project.type}{project.years && big ? ` · ${project.years}` : ''}</span>
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
		class="mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 gap-y-4 py-[clamp(24px,6vh,72px)] lg:h-dvh lg:grid-rows-[auto_minmax(0,1fr)_auto]"
	>
		<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2.5">
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
		<!-- The plates take the lead's natural 3:2 height, or the whole row when that is shorter. -->
		<div class="lg:[container-type:size]">
			<div
				class="grid gap-x-[clamp(20px,2.4vw,40px)] gap-y-[clamp(14px,2vh,24px)] lg:h-[min(100cqh,calc((100cqw-clamp(20px,2.4vw,40px))*7/18+1.75rem))] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-[minmax(0,1fr)]"
			>
				{@render plate(lead, true)}
				<div
					class="grid grid-cols-2 gap-x-[clamp(12px,1.4vw,20px)] gap-y-[clamp(14px,2vh,24px)] lg:grid-rows-[minmax(0,1fr)_auto_clamp(14px,2vh,24px)_minmax(0,1fr)_auto] lg:gap-y-0"
				>
					{#each rest as project (project.slug)}
						{@render plate(project, false)}
					{/each}
				</div>
			</div>
		</div>
		<p
			class="flex flex-wrap items-baseline gap-x-4.5 gap-y-1.5 border-t border-slate-400/20 pt-3.5 text-[clamp(16px,1.2vw,20px)]"
		>
			<span class="google-sans-code-500 mr-1.5 text-xs tracking-[0.08em] text-slate-400 uppercase"
				>Also</span
			>
			{#each others as project (project.slug)}
				{#if project.href}
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
