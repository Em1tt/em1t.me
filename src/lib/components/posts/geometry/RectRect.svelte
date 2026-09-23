<!--
	Axis-aligned rectangles: each one casts an interval onto both axes. They collide only when
	their intervals overlap on x and on y.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Stage from './Stage.svelte';
	import { draggable, within } from './drag';

	const W = 640;
	const H = 320;
	// The axes the rectangles cast their shadows onto.
	const AXIS_X = 296;
	const AXIS_Y = 24;

	let A = $state({ x: 130, y: 60, w: 190, h: 120 });
	let B = $state({ x: 380, y: 130, w: 150, h: 110 });

	const overlap = (a1: number, a2: number, b1: number, b2: number) => a1 <= b2 && b1 <= a2;
	const onX = $derived(overlap(A.x, A.x + A.w, B.x, B.x + B.w));
	const onY = $derived(overlap(A.y, A.y + A.h, B.y, B.y + B.h));
	const hit = $derived(onX && onY);
	const shared = (a1: number, a2: number, b1: number, b2: number) => [
		Math.max(a1, b1),
		Math.min(a2, b2)
	];
	const sharedX = $derived(shared(A.x, A.x + A.w, B.x, B.x + B.w));
	const sharedY = $derived(shared(A.y, A.y + A.h, B.y, B.y + B.h));
	const interval = (from: number, size: number) =>
		`[${Math.round(from)}, ${Math.round(from + size)}]`;

	const move = (rect: typeof A, point: { x: number; y: number }) => {
		const at = within(point, W - rect.w - 8, AXIS_X - rect.h - 14, 0);
		return { ...rect, x: Math.max(AXIS_Y + 18, at.x), y: Math.max(8, at.y) };
	};
</script>

<Stage
	height={H}
	interactive
	label="Two axis-aligned rectangles A and B, with their intervals drawn on the x axis below and the y axis on the left. Drag either rectangle."
	caption="Drag either rectangle."
	readout="x: {interval(A.x, A.w)} and {interval(B.x, B.w)} {onX
		? 'overlap'
		: 'don’t overlap'} · y: {interval(A.y, A.h)} and {interval(B.y, B.h)} {onY
		? 'overlap'
		: 'don’t overlap'} → {hit ? 'collision' : 'apart'}"
>
	<g stroke="#cbd5e1" stroke-width="1.5">
		<line x1={AXIS_Y} y1={AXIS_X} x2={W - 8} y2={AXIS_X} />
		<line x1={AXIS_Y} y1={AXIS_X} x2={AXIS_Y} y2="8" />
	</g>
	<text x={W - 20} y={AXIS_X + 20} class="math" fill="#e2e8f0">x</text>
	<text x={AXIS_Y - 16} y="22" class="math" fill="#e2e8f0">y</text>

	<!-- The shadows on each axis, and the part they share. -->
	<g stroke-width="6" stroke-linecap="butt">
		<line x1={A.x} y1={AXIS_X - 6} x2={A.x + A.w} y2={AXIS_X - 6} stroke={INKS.ember} />
		<line x1={B.x} y1={AXIS_X + 6} x2={B.x + B.w} y2={AXIS_X + 6} stroke="#45d16b" />
		<line x1={AXIS_Y + 6} y1={A.y} x2={AXIS_Y + 6} y2={A.y + A.h} stroke={INKS.ember} />
		<line x1={AXIS_Y - 6} y1={B.y} x2={AXIS_Y - 6} y2={B.y + B.h} stroke="#45d16b" />
		{#if onX}
			<line x1={sharedX[0]} y1={AXIS_X} x2={sharedX[1]} y2={AXIS_X} stroke="#f1f5f9" />
		{/if}
		{#if onY}
			<line x1={AXIS_Y} y1={sharedY[0]} x2={AXIS_Y} y2={sharedY[1]} stroke="#f1f5f9" />
		{/if}
	</g>
	<g stroke={INKS.orange} stroke-dasharray="3 5" opacity="0.7">
		<line x1={A.x} y1={A.y + A.h} x2={A.x} y2={AXIS_X} />
		<line x1={A.x + A.w} y1={A.y + A.h} x2={A.x + A.w} y2={AXIS_X} />
		<line x1={B.x} y1={B.y + B.h} x2={B.x} y2={AXIS_X} />
		<line x1={B.x + B.w} y1={B.y + B.h} x2={B.x + B.w} y2={AXIS_X} />
	</g>

	{#each [{ rect: A, name: 'A', color: INKS.ember, set: (r: typeof A) => (A = r) }, { rect: B, name: 'B', color: '#45d16b', set: (r: typeof A) => (B = r) }] as shape (shape.name)}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="Rectangle {shape.name}; drag or use the arrow keys"
			{@attach draggable(
				() => shape.rect,
				(point) => shape.set(move(shape.rect, point))
			)}
		>
			<rect
				x={shape.rect.x}
				y={shape.rect.y}
				width={shape.rect.w}
				height={shape.rect.h}
				fill={hit ? 'rgb(255 86 64 / 0.16)' : 'rgb(148 163 184 / 0.06)'}
				stroke={hit ? INKS.ember : shape.color}
				stroke-width="2"
			/>
			<text x={shape.rect.x + 12} y={shape.rect.y + 28} class="math" fill={shape.color}
				>{shape.name}</text
			>
		</g>
	{/each}
</Stage>
