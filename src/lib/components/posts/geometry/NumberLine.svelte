<!-- A number axis: the origin O splits it into a negative and a positive half-axis. -->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';

	const O = 320;
	const UNIT = 54;
	const Y = 104;
	const ticks = Array.from({ length: 11 }, (_, i) => i - 5);
</script>

<Stage
	height={170}
	label="A number axis with the origin O at 0, the negative half-axis to its left and the positive half-axis to its right, marked from −5 to 5"
>
	<line x1={O - 5.6 * UNIT} y1={Y} x2={O} y2={Y} stroke={INKS.orange} stroke-width="3" />
	<line x1={O} y1={Y} x2={O + 5.6 * UNIT} y2={Y} stroke="#45d16b" stroke-width="3" />
	<path d="M {O + 5.6 * UNIT + 12} {Y} l -14 -7 v 14 z" fill="#45d16b" />

	{#each ticks as n (n)}
		<line x1={O + n * UNIT} y1={Y - 7} x2={O + n * UNIT} y2={Y + 7} stroke="#cbd5e1" />
		<text x={O + n * UNIT} y={Y + 32} text-anchor="middle" class="mono">{n < 0 ? `−${-n}` : n}</text
		>
	{/each}

	<text x={O - 2.9 * UNIT} y={Y - 26} text-anchor="middle" class="mono" fill={INKS.orange}
		>negative half-axis</text
	>
	<text x={O + 2.9 * UNIT} y={Y - 26} text-anchor="middle" class="mono" fill="#45d16b"
		>positive half-axis</text
	>
	<Dot x={O} y={Y} r={9} color={INKS.ember} />
	<text x={O - 8} y={Y - 20} text-anchor="end" class="math" fill={INKS.ember}>O</text>
	<text x={O + 5.6 * UNIT + 4} y={Y + 32} class="math" fill="#e2e8f0">x</text>
</Stage>
