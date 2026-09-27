<!--
	Both models' pages for one frontend task, for the benchmark post: the top of each at 1280 px and on
	a 390 px phone, side by side. Clicking one opens the whole page, to scroll through, in a dialog.
	<Screens task="f1" alt={{ opus: 'A dark table…', astra: 'A light page…' }} />
	The images are static/blog/opus-5-5-vs-gpt-6-astra/<task>-<opus|astra>-<desktop|mobile>[-full].webp.
	Screenshots are content, so they stay plain: no halftone.
-->
<script lang="ts">
	import { MODELS, type Model } from './models';

	let { task, alt }: { task: string; alt: Record<Model, string> } = $props();

	type View = { model: Model; kind: 'desktop' | 'mobile' };
	const BASE = '/blog/opus-5-5-vs-gpt-6-astra';
	const ORDER: Model[] = ['opus', 'astra'];
	const VIEWS: View[] = ORDER.flatMap((model) => [
		{ model, kind: 'desktop' as const },
		{ model, kind: 'mobile' as const }
	]);

	const src = (view: View, full = false) =>
		`${BASE}/${task}-${view.model}-${view.kind}${full ? '-full' : ''}.webp`;
	const where = (view: View) => (view.kind === 'desktop' ? 'at 1280 px' : 'on a phone');

	let dialog: HTMLDialogElement;
	let scroller: HTMLElement;
	let open = $state(0);
	const current = $derived(VIEWS[open]);

	function show(i: number) {
		open = i;
		dialog.showModal();
		scroller.scrollTop = 0;
	}

	function step(by: number) {
		open = (open + by + VIEWS.length) % VIEWS.length;
		scroller.scrollTop = 0;
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') step(1);
		if (event.key === 'ArrowLeft') step(-1);
	}
</script>

<figure class="screens">
	{#each ORDER as model, m (model)}
		<div class="model">
			<p class="who">
				<span class="swatch" style:background={MODELS[model].color}></span>{MODELS[model].name}
			</p>
			<div class="pair">
				{#each VIEWS.slice(m * 2, m * 2 + 2) as view, v (view.kind)}
					<button
						type="button"
						onclick={() => show(m * 2 + v)}
						aria-label="Open the whole page {where(view)}: {alt[model]}"
					>
						<img
							src={src(view)}
							alt=""
							width={view.kind === 'desktop' ? 1280 : 390}
							height={view.kind === 'desktop' ? 900 : 844}
							loading="lazy"
						/>
					</button>
				{/each}
			</div>
		</div>
	{/each}
	<figcaption>
		The top of each page at 1280 px and on a 390 px phone. Click one to scroll through the whole
		page.
	</figcaption>
</figure>

<dialog
	bind:this={dialog}
	onkeydown={onKey}
	onclick={(event) => event.target === dialog && dialog.close()}
	aria-label="{MODELS[current.model].name}'s page {where(current)}"
>
	<div class="scroller" bind:this={scroller}>
		<img
			src={src(current, true)}
			alt="{alt[current.model]}, the whole page {where(current)}"
			class:phone={current.kind === 'mobile'}
		/>
	</div>
	<div class="bar">
		<span class="title">
			<span class="swatch" style:background={MODELS[current.model].color}></span>
			{MODELS[current.model].name}, {where(current)}
		</span>
		<span class="controls">
			<button type="button" onclick={() => step(-1)} aria-label="Previous page">←</button>
			<span class="count">{open + 1} / {VIEWS.length}</span>
			<button type="button" onclick={() => step(1)} aria-label="Next page">→</button>
			<button type="button" onclick={() => dialog.close()}>Close</button>
		</span>
	</div>
</dialog>

<style>
	.screens {
		display: grid;
		gap: 1.2em;
		max-width: none;
		margin: 1.6em 0 1.4em;
	}
	.model {
		display: grid;
		gap: 0.55em;
	}
	.who {
		display: flex;
		align-items: center;
		gap: 0.6em;
		max-width: none;
		margin: 0;
		font-family: 'Google Sans Code', monospace;
		font-size: 12px;
		letter-spacing: 0.04em;
		color: #cbd5e1;
	}
	.swatch {
		flex: none;
		width: 14px;
		height: 10px;
		border-radius: 0 3px 3px 0;
	}
	/* Column widths in proportion to each screenshot's width over its height, so both are as tall. */
	.pair {
		display: grid;
		grid-template-columns: minmax(0, 14.22fr) minmax(0, 4.62fr);
		align-items: start;
		gap: 10px;
	}
	.pair button {
		display: block;
		padding: 0;
		border: 1px solid rgb(148 163 184 / 0.2);
		background: #0c0a1a;
		cursor: zoom-in;
	}
	.pair button:hover {
		border-color: #ff5640;
	}
	.pair button:focus-visible {
		outline: 2px solid #ff5640;
		outline-offset: 2px;
	}
	.pair img {
		display: block;
		width: 100%;
		height: auto;
		margin: 0;
		border: 0;
	}
	figcaption {
		font-family: 'Google Sans Code', monospace;
		font-size: 12px;
		line-height: 1.5;
		color: #94a3b8;
	}
	dialog {
		/* Tailwind's reset zeroes margins, which un-centres a modal dialog. */
		margin: auto;
		width: fit-content;
		max-width: min(96vw, 1282px);
		max-height: 94vh;
		padding: 0;
		overflow: hidden;
		border: 1px solid rgb(148 163 184 / 0.25);
		background: #05030f;
		color: #e2e8f0;
	}
	dialog[open] {
		display: flex;
		flex-direction: column;
	}
	dialog::backdrop {
		background: rgb(5 3 15 / 0.88);
	}
	.scroller {
		min-height: 0;
		overflow: auto;
		overscroll-behavior: contain;
	}
	.scroller img {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 0 auto;
	}
	.scroller img.phone {
		width: 390px;
	}
	.bar {
		display: flex;
		flex: none;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 8px 16px;
		padding: 10px 12px;
		border-top: 1px solid rgb(148 163 184 / 0.2);
		font-family: 'Google Sans Code', monospace;
		font-size: 12px;
		color: #94a3b8;
	}
	.title {
		display: flex;
		align-items: center;
		gap: 0.6em;
		color: #cbd5e1;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.controls button {
		padding: 0.5em 0.75em;
		border: 0;
		background: #0c0a1a;
		color: #e2e8f0;
		font: inherit;
		cursor: pointer;
	}
	.controls button:hover {
		background: #a91a06;
	}
	.controls button:focus-visible {
		outline: 2px solid #ff5640;
		outline-offset: 2px;
	}
	.count {
		padding-inline: 6px;
	}
</style>
