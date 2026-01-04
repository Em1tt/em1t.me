<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type SquareType = 'solid' | 'transparent';

	type SquareProps = HTMLAttributes<HTMLDivElement> & {
		type?: SquareType;
		class?: string;
		children?: Snippet;
	};

	const props: SquareProps = $props();
	const { type = 'solid', class: className = '', children, ...rest } = props;
</script>

<div class="relative">
	<div
		class="absolute -top-[1px] -left-[1px] h-[calc(100%+2px)] w-[calc(100%+2px)] rounded-xl bg-[radial-gradient(circle_at_top_left,theme(colors.stone.600)_0%,theme(colors.stone.900)_30%,transparent)]
"
	></div>
	<div
		class="absolute opacity-25 -top-[1px] -left-[1px] h-[calc(100%+2px)] w-[calc(100%+2px)] rounded-xl bg-[radial-gradient(circle_at_top_left,transparent_80%,theme(colors.orange.400)_95%,theme(colors.orange.200)_100%)]
"
	></div>
	<div
		class="absolute opacity-5 top-0 left-0 h-full w-full rounded-xl bg-[radial-gradient(circle_at_bottom_right,theme(colors.orange.600)_0%,theme(colors.orange.400)_20%,transparent_50%)] z-20
"
	></div>
	<div
		class={`
    z-20
    aspect-square
    w-24
    rotate-0 rounded-xl bg-[radial-gradient(circle_at_top_left,theme(colors.stone.900)_0%,theme(colors.stone.950)_80%,theme(colors.stone.950)_100%)] p-4 text-orange-500
    ${className}
  `}
		{...rest}
	>
		{@render children?.()}
	</div>
</div>
