<!--
	The panel every geometry figure in the collision-detection post sits on: the same dark ground
	and 30-unit grid as the canvas demos, a caption, and an optional live readout.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		width?: number;
		height?: number;
		/** What the figure shows, for screen readers. */
		label: string;
		/** Interactive figures are groups of draggable shapes; static ones are one image. */
		interactive?: boolean;
		caption?: string;
		readout?: string;
		children: Snippet;
	};

	let {
		width = 640,
		height = 300,
		label,
		interactive = false,
		caption,
		readout,
		children
	}: Props = $props();

	const id = $props.id();
</script>

<figure class="demo">
	<svg
		viewBox="0 0 {width} {height}"
		class="block w-full touch-pan-y border border-slate-400/20 bg-[#05030f] select-none"
		role={interactive ? 'group' : 'img'}
		aria-label={label}
	>
		<defs>
			<pattern id="grid-{id}" width="30" height="30" patternUnits="userSpaceOnUse">
				<path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgb(148 163 184 / 0.12)" />
			</pattern>
		</defs>
		<rect {width} {height} fill="url(#grid-{id})" />
		{@render children()}
	</svg>
	{#if caption || readout}
		<figcaption class="google-sans-code-400 mt-2 text-xs leading-relaxed text-slate-400">
			{caption}
			{#if readout}<output class="text-slate-200">{readout}</output>{/if}
		</figcaption>
	{/if}
</figure>

<style>
	/* Shared by every figure's shapes and labels. */
	svg :global(.math) {
		font:
			italic 600 20px KaTeX_Math,
			Georgia,
			serif;
	}
	/* Numbers inside a maths label, upright like KaTeX prints them. */
	svg :global(.num) {
		font:
			400 18px 'Google Sans',
			sans-serif;
	}
	svg :global(.mono) {
		font:
			400 14px 'Google Sans Code',
			monospace;
		fill: #94a3b8;
	}
	/* On phones the figure shrinks to about half, so its lettering grows to stay readable. */
	@media (max-width: 640px) {
		svg :global(.math) {
			font-size: 25px;
		}
		svg :global(.num) {
			font-size: 22px;
		}
		svg :global(.mono) {
			font-size: 19px;
		}
	}
	svg :global(.handle) {
		cursor: grab;
		touch-action: none;
		outline: none;
	}
	svg :global(.handle:active) {
		cursor: grabbing;
	}
	svg :global(.handle:focus-visible) {
		stroke: #ff5640;
		stroke-width: 2;
		stroke-dasharray: 4 4;
	}
</style>
