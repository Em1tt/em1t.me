<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<p class="google-sans-code-500 text-xs tracking-widest text-slate-400 uppercase">
	<span class="inline-block bg-[#05030f] px-[0.75em] py-[0.6em] leading-none"
		>[{@render children()}]</span
	>
</p>
