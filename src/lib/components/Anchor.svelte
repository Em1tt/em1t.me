<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  type AnchorType = 'default' | 'button';

  type AnchorProps = HTMLAnchorAttributes & {
    type?: AnchorType;
    class?: string;
    children?: Snippet;
  };

  const props: AnchorProps = $props();

  const {
    href = '#',
    type = 'default',
    class: className = '',
    children,
    ...rest
  } = props;
</script>

<a
  href={href}
  class={`${
    type === 'button'
      ? `
        rounded-xl
        border border-stone-800
        bg-gradient-to-tr from-transparent to-stone-800/75
        px-5 py-2.5
        text-stone-300
        backdrop-blur-md
        hover:border-transparent
        hover:bg-none
        hover:bg-white
        hover:text-stone-900
        hover:[box-shadow:0_0_50px_-15px_white]
        hover:shadow-white/25
      `
      : `
        inline-block
        text-stone-300
        hover:bg-gradient-to-bl from-orange-400 to-orange-500
        bg-clip-text
        hover:text-transparent
        hover:[text-shadow:0_0_10px_rgb(251_146_60/0.75)]
      `
  } ${className}`}
  {...rest}
>
  {@render children?.()}
</a>
