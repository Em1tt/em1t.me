<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type GlowTextProps = HTMLAttributes<HTMLSpanElement> & {
		class?: string;
		children?: Snippet;
	};

	const props: GlowTextProps = $props();
	const { class: className = '', children, ...rest } = props;
</script>

<span
	class={`
    inline-block
    bg-gradient-to-bl from-orange-400 to-orange-500
    bg-clip-text
    font-bold
    text-transparent
    [text-shadow:0_0_30px_rgb(251_146_60/0.5)]
    ${className}
  `}
	{...rest}
>
	{@render children?.()}
</span>
