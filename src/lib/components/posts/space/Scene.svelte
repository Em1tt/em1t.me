<!--
	The panel every 3D figure in Part II of the collision-detection book sits on: the same dark
	ground as the 2D figures, a floor grid at y = 0 with the three axes, a caption and an optional
	live readout. Dragging anywhere but a shape turns the view (sideways on phones, where up and
	down scroll the page), and the two buttons turn it for keyboards.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { arrowhead, type Camera, type View } from './view';

	type Props = {
		view: View;
		camera: Camera;
		/** What the figure shows, for screen readers. */
		label: string;
		caption?: string;
		readout?: string;
		/** Half the floor's width, in units; 0 for no floor. */
		floor?: number;
		/** How far up the y-axis goes. */
		height?: number;
		children: Snippet;
	};

	let {
		view,
		camera = $bindable(),
		label,
		caption,
		readout,
		floor = 3,
		height = 3.4,
		children
	}: Props = $props();

	const lines = $derived(
		Array.from({ length: floor * 2 + 1 }, (_, i) => i - floor).flatMap((i) => [
			view.path([
				{ x: i, y: 0, z: -floor },
				{ x: i, y: 0, z: floor }
			]),
			view.path([
				{ x: -floor, y: 0, z: i },
				{ x: floor, y: 0, z: i }
			])
		])
	);
	const ends = $derived({
		x: { x: floor + 0.9, y: 0, z: 0 },
		y: { x: 0, y: height, z: 0 },
		z: { x: 0, y: 0, z: floor + 0.9 }
	});
	const starts = $derived({
		x: { x: -floor, y: 0, z: 0 },
		y: { x: 0, y: 0, z: 0 },
		z: { x: 0, y: 0, z: -floor }
	});
	const axes = ['x', 'y', 'z'] as const;
	// Axis labels sit just past each arrowhead.
	const tag = (axis: (typeof axes)[number]) => {
		const end = view.project(ends[axis]);
		const start = view.project(starts[axis]);
		const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
		return {
			x: end.x + ((end.x - start.x) / length) * 14,
			y: end.y + ((end.y - start.y) / length) * 14 + 6
		};
	};

	let from: { x: number; y: number } | null = null;
	const down = (event: PointerEvent) => {
		if (event.button !== 0) return;
		from = { x: event.clientX, y: event.clientY };
		(event.currentTarget as SVGElement).setPointerCapture(event.pointerId);
	};
	const move = (event: PointerEvent) => {
		if (!from) return;
		const pitch = camera.pitch + (event.clientY - from.y) * 0.008;
		camera = {
			yaw: camera.yaw - (event.clientX - from.x) * 0.008,
			pitch: Math.min(1.45, Math.max(0.05, pitch))
		};
		from = { x: event.clientX, y: event.clientY };
	};
	const up = () => (from = null);
	const turn = (by: number) => (camera = { ...camera, yaw: camera.yaw + by });

	const button =
		'google-sans-code-500 cursor-pointer bg-[#05030f] px-[0.7em] py-[0.45em] text-[13px] leading-none text-slate-300 hover:bg-[#a91a06] hover:text-white';
</script>

<figure class="demo">
	<div class="relative">
		<svg
			viewBox="0 0 {view.width} {view.height}"
			class="block w-full cursor-grab touch-pan-y border border-slate-400/20 bg-[#05030f] select-none active:cursor-grabbing"
			role="group"
			aria-label={label}
			onpointerdown={down}
			onpointermove={move}
			onpointerup={up}
			onpointercancel={up}
		>
			{#if floor}
				<g pointer-events="none">
					<path
						d={view.path(
							[
								{ x: -floor, y: 0, z: -floor },
								{ x: floor, y: 0, z: -floor },
								{ x: floor, y: 0, z: floor },
								{ x: -floor, y: 0, z: floor }
							],
							true
						)}
						fill="rgb(148 163 184 / 0.035)"
					/>
					{#each lines as d, i (i)}
						<path {d} stroke="rgb(148 163 184 / 0.16)" stroke-width="1" />
					{/each}
					{#each axes as axis (axis)}
						<path
							d={view.path([starts[axis], ends[axis]])}
							stroke="rgb(203 213 225 / 0.55)"
							stroke-width="1.5"
						/>
						<path d={arrowhead(view, starts[axis], ends[axis], 10)} fill="rgb(203 213 225 / 0.7)" />
						<text
							x={tag(axis).x}
							y={tag(axis).y}
							text-anchor="middle"
							class="math"
							fill="rgb(226 232 240 / 0.8)">{axis}</text
						>
					{/each}
				</g>
			{/if}
			{@render children()}
		</svg>
		<div class="absolute top-2 right-2 flex gap-1">
			<button
				type="button"
				class={button}
				aria-label="Turn the view left"
				title="Turn left"
				onclick={() => turn(-Math.PI / 8)}>↺</button
			>
			<button
				type="button"
				class={button}
				aria-label="Turn the view right"
				title="Turn right"
				onclick={() => turn(Math.PI / 8)}>↻</button
			>
		</div>
	</div>
	{#if caption || readout}
		<figcaption class="google-sans-code-400 mt-2 text-xs leading-relaxed text-slate-400">
			{caption}
			{#if readout}<output class="text-slate-200">{readout}</output>{/if}
		</figcaption>
	{/if}
</figure>
