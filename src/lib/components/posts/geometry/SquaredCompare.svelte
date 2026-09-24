<!--
	Skipping the square root: d ≤ r and d² ≤ r² always give the same answer. Two gauges show both
	comparisons; d² races ahead of d, but both cross their mark at the same moment.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import { draggable, within } from './drag';

	const H = 300;
	const R = 100;
	const S = { x: 165, y: 150 };
	// The gauges: 0 on the left, twice the radius (squared, for the second) on the right.
	const X0 = 360;
	const LENGTH = 250;

	let P = $state({ x: 250, y: 85 });

	const d = $derived(Math.round(Math.hypot(P.x - S.x, P.y - S.y)));
	const d2 = $derived(Math.round((P.x - S.x) ** 2 + (P.y - S.y) ** 2));
	const inside = $derived(d2 <= R * R);
	const colour = $derived(inside ? INKS.ember : INKS.orange);

	const gauges = $derived([
		{ y: 110, label: 'd vs r', value: d, mark: R, max: 2 * R, markLabel: 'r' },
		{ y: 220, label: 'd² vs r²', value: d2, mark: R * R, max: 4 * R * R, markLabel: 'r²' }
	]);
	const at = (value: number, max: number) => X0 + (Math.min(value, max) / max) * LENGTH;
</script>

<Stage
	height={H}
	interactive
	label="A circle with centre S and radius r, a point P, and two gauges comparing d with r and d squared with r squared. Drag P."
	caption="Drag P. d² grows much faster than d, but both cross their mark at the same moment."
	readout="d = {d} {inside ? '≤' : '>'} r = {R} · d² = {d2} {inside ? '≤' : '>'} r² = {R *
		R} → {inside ? 'inside' : 'outside'} either way"
>
	<circle
		cx={S.x}
		cy={S.y}
		r={R}
		fill={inside ? 'rgb(255 86 64 / 0.14)' : 'rgb(69 209 107 / 0.06)'}
		stroke={inside ? INKS.ember : '#45d16b'}
		stroke-width="2"
	/>
	<line x1={S.x} y1={S.y} x2={P.x} y2={P.y} stroke="#e2e8f0" stroke-width="2" />
	<text x={(S.x + P.x) / 2 + 8} y={(S.y + P.y) / 2 - 8} class="math" fill="#e2e8f0">d</text>
	<Dot x={S.x} y={S.y} color="#45d16b" />
	<text x={S.x - 14} y={S.y + 30} class="math" fill="#45d16b">S</text>

	<line x1="340" y1="20" x2="340" y2="280" stroke="rgb(148 163 184 / 0.25)" />
	{#each gauges as gauge (gauge.label)}
		<text x={X0} y={gauge.y - 26} class="mono">{gauge.label}</text>
		<line
			x1={X0}
			y1={gauge.y}
			x2={X0 + LENGTH}
			y2={gauge.y}
			stroke="rgb(148 163 184 / 0.3)"
			stroke-width="14"
		/>
		<line
			x1={X0}
			y1={gauge.y}
			x2={at(gauge.value, gauge.max)}
			y2={gauge.y}
			stroke={colour}
			stroke-width="14"
		/>
		{#if gauge.value > gauge.max}
			<path d="M {X0 + LENGTH + 6} {gauge.y - 7} l 9 7 l -9 7 z" fill={colour} />
		{/if}
		<line
			x1={at(gauge.mark, gauge.max)}
			y1={gauge.y - 14}
			x2={at(gauge.mark, gauge.max)}
			y2={gauge.y + 14}
			stroke="#f1f5f9"
			stroke-width="2"
		/>
		<text
			x={at(gauge.mark, gauge.max)}
			y={gauge.y + 36}
			text-anchor="middle"
			class="math"
			fill="#f1f5f9">{gauge.markLabel}</text
		>
	{/each}

	<g
		class="handle"
		tabindex="0"
		role="button"
		aria-label="Point P; drag or use the arrow keys"
		{@attach draggable(
			() => P,
			(point) => (P = within(point, 330, H, 12))
		)}
	>
		<circle cx={P.x} cy={P.y} r="22" fill="transparent" />
		<Dot x={P.x} y={P.y} color={INKS.ember} />
		<text x={P.x + 12} y={P.y - 12} class="math" fill={INKS.ember}>P</text>
	</g>
</Stage>
