<!--
	How each judge voted on one pair of pages, for the benchmark post. A judge saw the pair twice,
	labelled A and B and swapped the second time, without knowing which model made which.
	<Verdicts verdicts={[{ judge: 'opus', picks: ['astra', 'astra'], quote: '…', note: '…' }]} />
-->
<script lang="ts">
	import { MODELS, type Model } from './models';

	type Verdict = { judge: Model; picks: [Model, Model]; quote: string; note?: string };
	let { verdicts }: { verdicts: Verdict[] } = $props();
</script>

<div class="verdicts">
	{#each verdicts as verdict (verdict.judge)}
		<section class="verdict" aria-label="{MODELS[verdict.judge].name}'s verdict">
			<p class="judge">{MODELS[verdict.judge].name}, judging blind</p>
			<p class="picks">
				{#each verdict.picks as pick, i (i)}
					<span class="pick">
						<span class="swatch" style:background={MODELS[pick].color}></span>{MODELS[pick].name}
					</span>
				{/each}
			</p>
			<blockquote>“{verdict.quote}”</blockquote>
			{#if verdict.note}<p class="note">{verdict.note}</p>{/if}
		</section>
	{/each}
</div>

<style>
	.verdicts {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		max-width: none;
		margin: 0 0 1.6em;
		border: 1px solid rgb(148 163 184 / 0.2);
	}
	.verdict {
		display: grid;
		align-content: start;
		gap: 0.6em;
		padding: 0.9em 1em 1em;
	}
	.verdict + .verdict {
		border-left: 1px solid rgb(148 163 184 / 0.2);
	}
	p {
		max-width: none;
		margin: 0;
	}
	.judge {
		font-family: 'Google Sans Code', monospace;
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #94a3b8;
	}
	.picks {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em 1.2em;
		font-family: 'Google Sans Code', monospace;
		font-size: 12px;
		color: #e2e8f0;
	}
	.pick {
		display: inline-flex;
		align-items: center;
		gap: 0.55em;
	}
	.swatch {
		flex: none;
		width: 14px;
		height: 10px;
		border-radius: 0 3px 3px 0;
	}
	blockquote {
		max-width: none;
		margin: 0;
		padding: 0;
		border: 0;
		font-size: 0.86em;
		line-height: 1.6;
		font-style: italic;
		color: #cbd5e1;
	}
	.note {
		font-family: 'Google Sans Code', monospace;
		font-size: 12px;
		line-height: 1.5;
		color: #94a3b8;
	}
	@media (max-width: 640px) {
		.verdicts {
			grid-template-columns: minmax(0, 1fr);
		}
		.verdict + .verdict {
			border-top: 1px solid rgb(148 163 184 / 0.2);
			border-left: 0;
		}
	}
</style>
