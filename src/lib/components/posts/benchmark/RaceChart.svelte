<!--
	Minutes each model took, as bars on a track as long as the 60-minute limit, for the benchmark post.
	One task, at the top of its section (the models are named on their bars):
	<RaceChart rows={[{ task: 'F1 · Data table', checks: 21, opus: 45.4, astra: 8.2 }]} />
	Several tasks: pass them all; the chart then gets a legend and a label per task.
-->
<script lang="ts">
	import { MODELS, minutes, type Model } from './models';

	type Row = { task: string; checks: number; opus: number; astra: number };
	let { rows, limit = 60, caption }: { rows: Row[]; limit?: number; caption?: string } = $props();

	const ORDER: Model[] = ['opus', 'astra'];
	const single = $derived(rows.length === 1);
	const share = (value: number) => `${Math.min(100, (value / limit) * 100)}%`;
</script>

<figure class="race" class:single>
	{#if !single}
		<ul class="legend">
			{#each ORDER as model (model)}
				<li>
					<span class="swatch" style:background={MODELS[model].color}></span>{MODELS[model].name}
				</li>
			{/each}
		</ul>
	{/if}
	<ol class="rows">
		{#each rows as row (row.task)}
			<li class="row">
				<p class="task">
					{row.task}{#if single}<span class="checks">&nbsp;· {row.checks} hidden checks</span>{/if}
				</p>
				<div class="bars">
					{#each ORDER as model (model)}
						<p class="line">
							<span class={single ? 'who' : 'sr-only'}>{MODELS[model].name}</span>
							<span class="track" aria-hidden="true">
								<span
									class="fill"
									style:width={share(row[model])}
									style:background={MODELS[model].color}
								></span>
							</span>
							<span class="value"
								>{minutes(row[model])}{#if single}<span class="passed"
										>&nbsp;· {row.checks}/{row.checks}</span
									>{/if}</span
							>
						</p>
					{/each}
				</div>
			</li>
		{/each}
	</ol>
	{#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
	/* As wide as the post's text (40em of its font); the lettering inside is set smaller. */
	.race {
		max-width: 40em;
		margin: 1.6em 0 2em;
		font-family: 'Google Sans Code', monospace;
		line-height: 1.4;
		color: #94a3b8;
	}
	/* The post caps lists at 40em, which at this size would be narrower than the figure. */
	.legend,
	.rows,
	figcaption {
		max-width: none;
		font-size: 12px;
	}
	.race.single {
		margin: 0.2em 0 1.5em;
		padding: 0.75em 0.85em 0.7em;
		border: 1px solid rgb(148 163 184 / 0.2);
		background: #0c0a1a;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em 1.6em;
		margin: 0 0 1.1em;
		padding: 0;
		list-style: none;
		letter-spacing: 0.04em;
		color: #cbd5e1;
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 0.6em;
		margin: 0;
	}
	.swatch {
		width: 14px;
		height: 10px;
		border-radius: 0 3px 3px 0;
	}
	.rows {
		display: grid;
		gap: 0.95em;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.row {
		display: grid;
		grid-template-columns: 13.5em minmax(0, 1fr);
		align-items: center;
		gap: 0.35em 1em;
		margin: 0;
		transition: opacity 0.15s;
	}
	/* Pointing at one task dims the others. */
	@media (hover: hover) {
		.rows:hover .row:not(:hover) {
			opacity: 0.4;
		}
	}
	.single .row {
		grid-template-columns: minmax(0, 1fr);
	}
	.task {
		max-width: none;
		margin: 0;
		letter-spacing: 0.04em;
		color: #cbd5e1;
	}
	.single .task {
		margin-bottom: 0.3em;
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #ff5640;
	}
	.checks {
		color: #94a3b8;
	}
	.bars {
		display: grid;
		gap: 4px;
	}
	.line {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 4.4em;
		align-items: center;
		gap: 0.8em;
		max-width: none;
		margin: 0;
	}
	.single .line {
		grid-template-columns: 7.6em minmax(0, 1fr) 8.6em;
	}
	.who {
		color: #cbd5e1;
	}
	/* The track is the 60-minute limit; a bar is the share of it a run used. */
	.track {
		display: block;
		height: 10px;
		background: rgb(148 163 184 / 0.07);
	}
	.fill {
		display: block;
		height: 100%;
		border-radius: 0 4px 4px 0;
	}
	.value {
		color: #e2e8f0;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.passed {
		color: #94a3b8;
	}
	figcaption {
		margin-top: 1.1em;
		color: #94a3b8;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	@media (max-width: 640px) {
		.row {
			grid-template-columns: minmax(0, 1fr);
		}
		.single .line {
			grid-template-columns: 6.9em minmax(0, 1fr) 7.8em;
			gap: 0.6em;
		}
	}
</style>
