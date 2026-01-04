<script lang="ts">
	import type { Snippet } from 'svelte';
	import Anchor from './Anchor.svelte';

	type CardProps = {
		title: string;
		subtitle?: string;
		iconSrc?: string;
		iconAlt?: string;

		href?: string;
		linkText?: string;

		class?: string;

		/** main card content */
		children?: Snippet;

		/** optional footer override */
		footer?: Snippet;
	};

	const props: CardProps = $props();

	const {
		title,
		subtitle,
		iconSrc,
		iconAlt = '',
		href = '/',
		linkText = 'Learn more ›',
		class: className = '',
		children,
		footer
	} = props;
</script>
<div class="relative isolate">
	<!-- Border gradient (bottom layer) -->
	<div class="absolute -top-[1px] -left-[1px] -z-20 h-full w-[calc(100%+2px)] rounded-xl bg-gradient-to-b from-stone-800 via-transparent via-5% to-transparent"></div>
	<!-- Radial gradient border (bottom layer) -->
	<div class="absolute -top-[1px] -left-[1px] -z-10 h-full w-[calc(100%+2px)] rounded-xl bg-[radial-gradient(ellipse_at_top,theme(colors.stone.600)_0%,theme(colors.stone.800)_30%,transparent)]"></div>
	<!-- Content (middle layer) -->
	<div class={`relative z-0 flex h-full flex-col rounded-xl bg-[radial-gradient(circle_at_top,theme(colors.stone.900)_0%,theme(colors.stone.950)_30%,theme(colors.stone.950)_100%)] p-4${className}`}>
	<!-- Header -->
	<div class="flex flex-row gap-2">
		{#if iconSrc}
			<div>
				<img src={iconSrc} alt={iconAlt} width="32" />
			</div>
		{/if}

		<div class="flex flex-col items-start">
			<p class="text-lg font-bold text-stone-300">{title}</p>
			{#if subtitle}
				<p class="text-sm text-stone-400">{subtitle}</p>
			{/if}
		</div>
	</div>

	<hr class="my-2 h-[1px] border-stone-900" />

	<!-- Body -->
	<div class="break-words text-stone-300">
		{@render children?.()}
	</div>

	<!-- Footer (sticks to bottom) -->
	{#if footer}
		<div class="mt-auto">
			{@render footer()}
		</div>
	{:else}
        <Anchor class="mt-auto self-end text-white pt-4">{linkText}</Anchor>
	{/if}
</div>

</div>