<script lang="ts">
	import type { Snippet } from 'svelte';

	type AnchorProps = {
		children?: Snippet;
        noPadding?: boolean;
        color?: 'white' | 'orange'
};

	const props: AnchorProps = $props();

	const { children, noPadding, color } = props;
</script>

<div class="relative">
	<div
		class="absolute -top-[1px] -left-[1px] h-full w-[calc(100%+2px)] rounded-lg bg-gradient-to-br
        {color == "white" ? "from-white/5" : "from-orange-500/5"}
        from-orange-500/4 via-transparent via-50% to-transparent z-30 pointer-events-none"
	></div>
	<div
		class="absolute -top-[1px] -left-[1px] h-[calc(100%+2px)] w-[calc(100%+2px)] rounded-lg bg-gradient-to-br 
        {color == "white" ? "from-white/50" : "from-orange-500/50"} via-stone-800/50 via-10% to-60% to-transparent"
	></div>
	<div class="z-20 rotate-0 rounded-lg bg-stone-950 {noPadding ? "" : "p-6"}">
		{@render children?.()}
	</div>
</div>
