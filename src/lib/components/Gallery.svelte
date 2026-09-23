<!--
	Images side by side instead of one per row, for posts and case studies:
	<Gallery images={[{ src: '/a.webp', alt: '…', caption: '…' }, …]} />
	Nothing is cropped. Clicking an image opens it full size; arrow keys step through, Esc closes.
-->
<script lang="ts">
	type Image = { src: string; alt: string; caption?: string };

	let { images, columns }: { images: Image[]; columns?: 1 | 2 | 3 } = $props();

	// One image gets the full width; otherwise two per row unless told otherwise.
	const perRow = $derived(columns ?? Math.min(images.length, 2));

	let dialog: HTMLDialogElement;
	let open = $state(0);

	function show(i: number) {
		open = i;
		dialog.showModal();
	}

	function step(by: number) {
		open = (open + by + images.length) % images.length;
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') step(1);
		if (event.key === 'ArrowLeft') step(-1);
	}
</script>

<div class="gallery" style:--columns={perRow}>
	{#each images as image, i (image.src)}
		<figure>
			<button type="button" onclick={() => show(i)} aria-label="Enlarge: {image.alt}">
				<img src={image.src} alt={image.alt} loading="lazy" />
			</button>
			{#if image.caption}<figcaption>{image.caption}</figcaption>{/if}
		</figure>
	{/each}
</div>

<dialog
	bind:this={dialog}
	onkeydown={onKey}
	onclick={(event) => event.target === dialog && dialog.close()}
	aria-label={images[open]?.alt}
>
	{#if images[open]}
		<img src={images[open].src} alt={images[open].alt} />
		<div class="bar">
			<span>{images[open].caption ?? images[open].alt}</span>
			<span class="controls">
				{#if images.length > 1}
					<button type="button" onclick={() => step(-1)} aria-label="Previous image">←</button>
					<span class="count">{open + 1} / {images.length}</span>
					<button type="button" onclick={() => step(1)} aria-label="Next image">→</button>
				{/if}
				<button type="button" onclick={() => dialog.close()} aria-label="Close">Close</button>
			</span>
		</div>
	{/if}
</dialog>

<style>
	.gallery {
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		gap: 14px;
		align-items: start;
		margin: 1.6em 0 2em;
	}
	@media (max-width: 640px) {
		.gallery {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.gallery figure {
		margin: 0;
		max-width: none;
	}
	.gallery button {
		display: block;
		width: 100%;
		padding: 0;
		border: 1px solid rgb(148 163 184 / 0.2);
		background: #0c0a1a;
		cursor: zoom-in;
	}
	.gallery button:hover {
		border-color: #ff5640;
	}
	.gallery button:focus-visible {
		outline: 2px solid #ff5640;
		outline-offset: 2px;
	}
	.gallery img {
		display: block;
		width: 100%;
		height: auto;
		margin: 0;
		border: 0;
	}
	.gallery figcaption {
		margin-top: 8px;
		font-family: 'Google Sans Code', monospace;
		font-size: 12px;
		line-height: 1.5;
		color: #94a3b8;
	}
	dialog {
		/* Tailwind's reset zeroes margins, which un-centres a modal dialog. */
		margin: auto;
		max-width: min(96vw, 1600px);
		max-height: 94vh;
		padding: 0;
		border: 1px solid rgb(148 163 184 / 0.25);
		background: #05030f;
		color: #e2e8f0;
	}
	dialog::backdrop {
		background: rgb(5 3 15 / 0.88);
	}
	dialog img {
		display: block;
		max-width: 100%;
		max-height: calc(94vh - 52px);
		margin: 0 auto;
		object-fit: contain;
	}
	.bar {
		display: flex;
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
	.count {
		padding-inline: 6px;
	}
</style>
