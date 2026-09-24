<!--
	One example in several languages, for .svx posts. Put a ```js, a ```ts and a ```py block inside,
	with blank lines around them; the tabs show one, and every group on the page switches together.
-->
<script lang="ts">
	import { onMount, tick, type Snippet } from 'svelte';
	import { codeLanguage, LANGUAGES, type CodeLanguage } from '$lib/codeLanguage.svelte';

	let { children }: { children: Snippet } = $props();

	let tabs: HTMLElement;

	onMount(() => codeLanguage.restore());

	// Other groups above this one change height too; keep these tabs where the reader clicked them.
	async function choose(language: CodeLanguage) {
		const before = tabs.getBoundingClientRect().top;
		codeLanguage.set(language);
		await tick();
		window.scrollBy({ top: tabs.getBoundingClientRect().top - before, behavior: 'instant' });
	}
</script>

<div class="code-group" data-show={codeLanguage.current}>
	<div bind:this={tabs} class="code-tabs" role="group" aria-label="Language of the code examples">
		{#each LANGUAGES as language (language.id)}
			<button
				type="button"
				title={language.name}
				aria-pressed={codeLanguage.current === language.id}
				onclick={() => choose(language.id)}>{language.label}</button
			>
		{/each}
	</div>
	{@render children()}
</div>

<style>
	.code-group {
		max-width: 40em;
		margin: 0 0 1.15em;
	}
	.code-group :global(figure.code) {
		margin: 0;
		border-top: 0;
	}
	.code-group[data-show='javascript'] :global(figure.code:not([data-lang='javascript'])),
	.code-group[data-show='typescript'] :global(figure.code:not([data-lang='typescript'])),
	.code-group[data-show='python'] :global(figure.code:not([data-lang='python'])) {
		display: none;
	}
	.code-tabs {
		display: flex;
		border: 1px solid rgb(148 163 184 / 0.2);
		border-bottom: 0;
		background: #05030f;
	}
	.code-tabs button {
		padding: 0.6em 0.95em;
		border-right: 1px solid rgb(148 163 184 / 0.2);
		font-family: 'Google Sans Code', monospace;
		font-size: 12px;
		letter-spacing: 0.08em;
		color: #94a3b8;
		cursor: pointer;
	}
	.code-tabs button:hover {
		color: #e2e8f0;
	}
	.code-tabs button[aria-pressed='true'] {
		background: #0c0a1a;
		color: #ff5640;
		box-shadow: inset 0 -2px 0 #ff5640;
	}
	.code-tabs button:focus-visible {
		outline: 2px solid #ff5640;
		outline-offset: -2px;
	}
</style>
