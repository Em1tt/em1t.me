<!--
	Time and space complexity for the functions in the code example above it, for .svx posts:
	<Complexity items={[{ name: 'pointInPolygon', time: 'O(n)', space: 'O(1)' }]} />
	Names are written in camelCase and follow the language tabs (snake_case for Python).
-->
<script lang="ts">
	import { codeLanguage } from '$lib/codeLanguage.svelte';

	type Item = { name: string; time: string; space: string; note?: string };
	let { items }: { items: Item[] } = $props();

	const label = (name: string) =>
		codeLanguage.current === 'python'
			? name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
			: name;
</script>

<dl class="complexity" aria-label="Time and space complexity">
	{#each items as item (item.name)}
		<dt><code>{label(item.name)}</code></dt>
		<dd>
			<span>time <b>{item.time}</b></span>
			<span>space <b>{item.space}</b></span>
			{#if item.note}<span class="note">{item.note}</span>{/if}
		</dd>
	{/each}
</dl>

<style>
	/* Sized in the post's own em, like the code box above it; only the text is small. */
	.complexity {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.3em 1em;
		max-width: 40em;
		margin: 0 0 1.6rem;
		padding: 0.6em 0.8em;
		border: 1px solid rgb(148 163 184 / 0.2);
		border-top: 0;
	}
	dt,
	dd {
		font-family: 'Google Sans Code', monospace;
		font-size: 12px;
		line-height: 1.6;
		color: #94a3b8;
	}
	.complexity dt code {
		padding: 0;
		border: 0;
		background: none;
		font-size: inherit;
		color: #e2e8f0;
	}
	dd {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2em 1.2em;
		margin: 0;
	}
	b {
		font-weight: 500;
		color: #ff5640;
	}
	.note {
		flex-basis: 100%;
		color: #64748b;
	}
</style>
