<!--
	Distance from a point to a line, in grid squares: ax + by + c is 0 on the line, positive on the
	side the normal points to, negative on the other, and |ax + by + c| / √(a² + b²) is the distance.
-->
<script lang="ts">
	import { INKS } from '$lib/halftone';
	import Dot from './Dot.svelte';
	import Stage from './Stage.svelte';
	import { normalize } from './collide';
	import { draggable, snap, within, type Point } from './drag';
	import { num, plus, squared } from './format';

	const W = 640;
	const H = 300;
	const U = 30;

	let P1 = $state({ x: 2 * U, y: 8 * U });
	let P2 = $state({ x: 19 * U, y: 2 * U });
	let P = $state({ x: 13 * U, y: 7 * U });

	const u = (p: Point) => ({ x: Math.round(p.x / U), y: Math.round(p.y / U) });
	const p1 = $derived(u(P1));
	const p2 = $derived(u(P2));
	const p = $derived(u(P));
	const a = $derived(p2.y - p1.y);
	const b = $derived(p1.x - p2.x);
	const c = $derived(p2.x * p1.y - p1.x * p2.y);
	const same = $derived(a === 0 && b === 0);
	const value = $derived(a * p.x + b * p.y + c);
	const d = $derived(same ? 0 : Math.abs(value) / Math.hypot(a, b));

	// Pixel geometry: the line's direction, its unit normal, and the foot F of the perpendicular.
	const dir = $derived(normalize({ x: P2.x - P1.x, y: P2.y - P1.y }));
	const n = $derived(normalize({ x: a, y: b }));
	const F = $derived(
		same
			? P
			: {
					x: P.x - (value / (a * a + b * b)) * a * U,
					y: P.y - (value / (a * a + b * b)) * b * U
				}
	);
	const FAR = 2000;
	const halfPlane = (sign: number) => {
		const l1 = { x: P1.x - dir.x * FAR, y: P1.y - dir.y * FAR };
		const l2 = { x: P2.x + dir.x * FAR, y: P2.y + dir.y * FAR };
		const o = { x: n.x * FAR * sign, y: n.y * FAR * sign };
		return `${l1.x},${l1.y} ${l2.x},${l2.y} ${l2.x + o.x},${l2.y + o.y} ${l1.x + o.x},${l1.y + o.y}`;
	};
	const M = $derived({ x: (P1.x + P2.x) / 2, y: (P1.y + P2.y) / 2 });
	const sideName = $derived(value > 0 ? '+ side' : value < 0 ? '− side' : 'on the line');

	const handles: { name: string; label: string; get: () => Point; set: (p: Point) => void }[] = [
		{ name: 'P1', label: 'P₁', get: () => P1, set: (q) => (P1 = q) },
		{ name: 'P2', label: 'P₂', get: () => P2, set: (q) => (P2 = q) }
	];
</script>

<Stage
	height={H}
	interactive
	label="A line through P1 and P2 dividing the grid into a plus side and a minus side, and a point P with its distance to the line. Drag any of the three points."
	caption="Drag P, P₁ or P₂; one square is one unit. The + side is where the normal (a, b) points."
	readout={same
		? 'P₁ and P₂ are the same point: a line needs two.'
		: `ax₀ + by₀ + c = ${num(a)}·${p.x} ${plus(b)}·${p.y} ${plus(c)} = ${value} → ${sideName} · d = |${value}| / √(${squared(a)} + ${squared(b)}) = ${d.toFixed(2)}`}
>
	{#if !same}
		<polygon points={halfPlane(1)} fill="rgb(69 209 107 / 0.08)" />
		<polygon points={halfPlane(-1)} fill="rgb(204 80 0 / 0.1)" />
		<line
			x1={P1.x - dir.x * FAR}
			y1={P1.y - dir.y * FAR}
			x2={P2.x + dir.x * FAR}
			y2={P2.y + dir.y * FAR}
			stroke="#e2e8f0"
			stroke-width="2"
		/>
		<text
			x={Math.min(W - 24, Math.max(24, M.x + n.x * 70))}
			y={Math.min(H - 16, Math.max(30, M.y + n.y * 70))}
			text-anchor="middle"
			class="math"
			fill="#45d16b">+</text
		>
		<text
			x={Math.min(W - 24, Math.max(24, M.x - n.x * 70))}
			y={Math.min(H - 16, Math.max(30, M.y - n.y * 70))}
			text-anchor="middle"
			class="math"
			fill={INKS.orange}>−</text
		>
		<line
			x1={P.x}
			y1={P.y}
			x2={F.x}
			y2={F.y}
			stroke="#f1f5f9"
			stroke-width="2"
			stroke-dasharray="6 5"
		/>
		<Dot x={F.x} y={F.y} r={4} color="#f1f5f9" />
		<text x={(P.x + F.x) / 2 + 10} y={(P.y + F.y) / 2 + 4} class="math" fill="#f1f5f9">d</text>
	{/if}

	{#each handles as handle (handle.name)}
		<g
			class="handle"
			tabindex="0"
			role="button"
			aria-label="Point {handle.name} on the line; drag or use the arrow keys"
			{@attach draggable(handle.get, (q) => handle.set(snap(within(q, W, H, U))), U)}
		>
			<circle cx={handle.get().x} cy={handle.get().y} r="20" fill="transparent" />
			<Dot x={handle.get().x} y={handle.get().y} r={5} color="#e2e8f0" />
			<text x={handle.get().x - 10} y={handle.get().y + 28} class="math" fill="#e2e8f0"
				>{handle.label}</text
			>
		</g>
	{/each}
	<g
		class="handle"
		tabindex="0"
		role="button"
		aria-label="Point P; drag or use the arrow keys"
		{@attach draggable(
			() => P,
			(q) => (P = snap(within(q, W, H, U))),
			U
		)}
	>
		<circle cx={P.x} cy={P.y} r="22" fill="transparent" />
		<Dot x={P.x} y={P.y} color={INKS.ember} />
		<text x={P.x + 12} y={P.y - 12} class="math" fill={INKS.ember}
			>P<tspan class="num">({p.x},&#160;{p.y})</tspan></text
		>
	</g>
</Stage>
