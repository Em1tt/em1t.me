<!-- Makes whatever it wraps in a 3D figure draggable, and movable with the arrow keys. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Vec3 } from './space';
	import { movable, type View } from './view';

	type Props = {
		view: View;
		get: () => Vec3;
		set: (p: Vec3) => void;
		/** What it is, for screen readers. */
		label: string;
		/** How far an arrow key moves it: the figure's grid, if it snaps to one. */
		step?: number;
		children: Snippet;
	};
	let { view, get, set, label, step = 0.25, children }: Props = $props();
</script>

<g
	class="handle"
	tabindex="0"
	role="button"
	aria-label="{label}; drag or use the arrow keys"
	{@attach movable(() => view, get, set, step)}
>
	{@render children()}
</g>
