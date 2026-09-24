import type { Attachment } from 'svelte/attachments';

export type Point = { x: number; y: number };

/**
 * Makes an SVG shape draggable in its SVG's own units, with the pointer or with the arrow keys
 * (Shift for five times the step). `get` reads the shape's position and `set` moves it; shapes
 * that snap to a grid should step one grid square.
 */
export function draggable(
	get: () => Point,
	set: (point: Point) => void,
	step = 6
): Attachment<SVGElement> {
	return (element) => {
		const svg = element.ownerSVGElement!;
		let offset: Point | null = null;

		const toSvg = (event: PointerEvent) => {
			const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
				svg.getScreenCTM()!.inverse()
			);
			return { x: point.x, y: point.y };
		};
		const down = (event: PointerEvent) => {
			const pointer = toSvg(event);
			const at = get();
			offset = { x: at.x - pointer.x, y: at.y - pointer.y };
			element.setPointerCapture(event.pointerId);
			event.preventDefault();
		};
		const move = (event: PointerEvent) => {
			if (!offset) return;
			const pointer = toSvg(event);
			set({ x: pointer.x + offset.x, y: pointer.y + offset.y });
		};
		const up = () => (offset = null);
		const keys: Record<string, Point> = {
			ArrowLeft: { x: -1, y: 0 },
			ArrowRight: { x: 1, y: 0 },
			ArrowUp: { x: 0, y: -1 },
			ArrowDown: { x: 0, y: 1 }
		};
		const key = (event: KeyboardEvent) => {
			const direction = keys[event.key];
			if (!direction) return;
			const size = event.shiftKey ? step * 5 : step;
			const at = get();
			set({ x: at.x + direction.x * size, y: at.y + direction.y * size });
			event.preventDefault();
		};

		element.addEventListener('pointerdown', down);
		element.addEventListener('pointermove', move);
		element.addEventListener('pointerup', up);
		element.addEventListener('pointercancel', up);
		element.addEventListener('keydown', key);
		return () => {
			element.removeEventListener('pointerdown', down);
			element.removeEventListener('pointermove', move);
			element.removeEventListener('pointerup', up);
			element.removeEventListener('pointercancel', up);
			element.removeEventListener('keydown', key);
		};
	};
}

/** Keeps a point inside a box, so nothing can be dragged out of view. */
export function within(point: Point, width: number, height: number, margin = 0): Point {
	return {
		x: Math.min(width - margin, Math.max(margin, point.x)),
		y: Math.min(height - margin, Math.max(margin, point.y))
	};
}

/** Rounds a point to the nearest grid crossing, so figures can count in whole grid squares. */
export const snap = (point: Point, step = 30): Point => ({
	x: Math.round(point.x / step) * step,
	y: Math.round(point.y / step) * step
});
