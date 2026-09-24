// How Part II's figures look at space: an orthographic camera that turns around the y-axis and
// tilts down, so spheres stay round and parallel edges stay parallel. Shapes are dragged parallel
// to the screen; turning the view changes which way that moves them.
import type { Attachment } from 'svelte/attachments';
import { add, cross, dot, normalize, planeAt, scale, subtract, type Vec3 } from './space';

/** Turned `yaw` radians around the y-axis, and tilted `pitch` radians down from level. */
export type Camera = { yaw: number; pitch: number };
export type Frame = { width: number; height: number; scale: number; target: Vec3 };
export type View = ReturnType<typeof makeView>;

export const CAMERA: Camera = { yaw: -0.55, pitch: 0.42 };
export const FRAME: Frame = { width: 640, height: 360, scale: 54, target: { x: 0, y: 1, z: 0 } };

/** The tilted plane the figures test shapes against: a gentle ramp through (0, 1, 0). */
export const RAMP = planeAt({ x: 0, y: 1, z: 0 }, { x: 0.25, y: 1, z: 0.15 });

export function makeView(camera: Camera, frame: Frame = FRAME) {
	const { yaw, pitch } = camera;
	// Towards the viewer, to the right on screen, and up on screen.
	const toward = {
		x: Math.sin(yaw) * Math.cos(pitch),
		y: Math.sin(pitch),
		z: Math.cos(yaw) * Math.cos(pitch)
	};
	const right = { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
	const up = {
		x: -Math.sin(yaw) * Math.sin(pitch),
		y: Math.cos(pitch),
		z: -Math.cos(yaw) * Math.sin(pitch)
	};
	const project = (p: Vec3) => {
		const q = subtract(p, frame.target);
		return {
			x: frame.width / 2 + dot(q, right) * frame.scale,
			y: frame.height / 2 - dot(q, up) * frame.scale,
			/** Bigger is nearer. */
			depth: dot(q, toward)
		};
	};
	const point = (p: Vec3) => {
		const q = project(p);
		return `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
	};

	return {
		...frame,
		camera,
		toward,
		right,
		up,
		project,
		/** A drag of (dx, dy) on screen, as a step in space parallel to the screen. */
		step: (dx: number, dy: number) =>
			add(scale(right, dx / frame.scale), scale(up, -dy / frame.scale)),
		/** An SVG path through points in space. */
		path: (points: Vec3[], closed = false) =>
			points.map((p, i) => `${i ? 'L' : 'M'} ${point(p)}`).join(' ') + (closed ? ' Z' : ''),
		/** Whether a face with this outward normal is turned towards the viewer. */
		facing: (normal: Vec3) => dot(normal, toward) > 0,
		/** Far things first, so nearer ones are drawn over them. */
		byDepth: <T>(items: T[], at: (item: T) => Vec3) =>
			[...items].sort((a, b) => project(at(a)).depth - project(at(b)).depth)
	};
}

/** An arrowhead at `to` for an arrow from `from`, drawn flat on the screen; '' if it points at you. */
export function arrowhead(view: View, from: Vec3, to: Vec3, size = 11) {
	const a = view.project(from);
	const b = view.project(to);
	const length = Math.hypot(b.x - a.x, b.y - a.y);
	if (length < size) return '';
	const u = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
	const base = { x: b.x - u.x * size, y: b.y - u.y * size };
	const half = size * 0.45;
	return `M ${b.x} ${b.y} L ${base.x - u.y * half} ${base.y + u.x * half} L ${base.x + u.y * half} ${base.y - u.x * half} Z`;
}

/** Points around a circle in space with this centre and radius, in the plane of u and v. */
export function circle(centre: Vec3, r: number, u: Vec3, v: Vec3, count = 48) {
	return Array.from({ length: count }, (_, i) => {
		const angle = (i / count) * Math.PI * 2;
		return add(centre, add(scale(u, r * Math.cos(angle)), scale(v, r * Math.sin(angle))));
	});
}

/** Two unit vectors at right angles to each other and to `normal`, to lay things out in its plane. */
export function across(normal: Vec3): [Vec3, Vec3] {
	const n = normalize(normal);
	const helper = Math.abs(n.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
	const u = normalize(cross(helper, n));
	return [u, cross(n, u)];
}

/** Keeps a point inside a box of space, rounded to `grid` if it's given. */
export function keep(p: Vec3, min: Vec3, max: Vec3, grid = 0): Vec3 {
	const fit = (value: number, low: number, high: number) =>
		Math.min(high, Math.max(low, grid ? Math.round(value / grid) * grid : value));
	return { x: fit(p.x, min.x, max.x), y: fit(p.y, min.y, max.y), z: fit(p.z, min.z, max.z) };
}

/** A number for a readout: rounded, without trailing zeros, with a real minus sign and no '−0'. */
export function fixed(n: number, digits = 1) {
	const rounded = Number(n.toFixed(digits));
	return rounded < 0 ? `−${-rounded}` : `${rounded}`;
}

export const triple = (p: Vec3, digits = 1) =>
	`(${fixed(p.x, digits)}, ${fixed(p.y, digits)}, ${fixed(p.z, digits)})`;

/** The axis direction (±x, ±y or ±z) closest to v. */
function nearestAxis(v: Vec3): Vec3 {
	const [x, y, z] = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)];
	if (x >= y && x >= z) return { x: Math.sign(v.x), y: 0, z: 0 };
	if (y >= z) return { x: 0, y: Math.sign(v.y), z: 0 };
	return { x: 0, y: 0, z: Math.sign(v.z) };
}

/**
 * Makes a shape in a figure draggable parallel to the screen. The arrow keys move it `step` units
 * (Shift: five times that) along whichever axis looks closest to the arrow's direction on screen,
 * so steps land on a figure's grid. `get` reads its position in space and `set` moves it.
 */
export function movable(
	view: () => View,
	get: () => Vec3,
	set: (p: Vec3) => void,
	step = 0.25
): Attachment<SVGElement> {
	return (element) => {
		const svg = element.ownerSVGElement!;
		let start: { x: number; y: number; at: Vec3 } | null = null;

		const toSvg = (event: PointerEvent) =>
			new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
		// Figures draw nearer shapes last, which can move this one in the page mid-drag, so the
		// drag follows the window rather than capturing the pointer on the shape.
		const move = (event: PointerEvent) => {
			if (!start) return;
			const pointer = toSvg(event);
			set(add(start.at, view().step(pointer.x - start.x, pointer.y - start.y)));
		};
		const up = () => {
			start = null;
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', up);
			window.removeEventListener('pointercancel', up);
		};
		const down = (event: PointerEvent) => {
			if (event.button !== 0) return;
			const pointer = toSvg(event);
			start = { x: pointer.x, y: pointer.y, at: get() };
			window.addEventListener('pointermove', move);
			window.addEventListener('pointerup', up);
			window.addEventListener('pointercancel', up);
			// The figure turns when the background is dragged, not a shape.
			event.stopPropagation();
			event.preventDefault();
		};
		const keys: Record<string, [number, number]> = {
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0],
			ArrowUp: [0, -1],
			ArrowDown: [0, 1]
		};
		const key = (event: KeyboardEvent) => {
			const direction = keys[event.key];
			if (!direction) return;
			const axis = nearestAxis(view().step(direction[0], direction[1]));
			set(add(get(), scale(axis, event.shiftKey ? step * 5 : step)));
			event.preventDefault();
			// A step towards or away from the viewer can redraw the shapes in a new order, and moving
			// this one in the page drops its focus.
			requestAnimationFrame(() => {
				if (document.activeElement === document.body) element.focus({ preventScroll: true });
			});
		};

		element.addEventListener('pointerdown', down);
		element.addEventListener('keydown', key);
		return () => {
			up();
			element.removeEventListener('pointerdown', down);
			element.removeEventListener('keydown', key);
		};
	};
}
