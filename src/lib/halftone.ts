// Canvas helpers that draw in the same language as the prints: round dots on a fixed grid.

export const INKS = {
	ember: '#ff5640',
	orange: '#cc5000',
	green: '#1f7507',
	darkGreen: '#14460a'
};

/** Size the canvas backing store to its CSS box and return a context drawing in CSS pixels. */
export function fitCanvas(canvas: HTMLCanvasElement, maxDpr = 2) {
	const rect = canvas.getBoundingClientRect();
	const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
	canvas.width = Math.max(1, Math.round(rect.width * dpr));
	canvas.height = Math.max(1, Math.round(rect.height * dpr));
	const ctx = canvas.getContext('2d')!;
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	return { ctx, width: rect.width, height: rect.height };
}

/** Sparse dark-green dots, like the ground of the prints. */
export function groundDots(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	pitch: number,
	seed: number
) {
	ctx.fillStyle = INKS.darkGreen;
	ctx.beginPath();
	for (let y = pitch / 2; y < height; y += pitch) {
		for (let x = pitch / 2; x < width; x += pitch) {
			const n =
				0.5 +
				0.5 *
					Math.sin(x * 0.011 + seed) *
					Math.cos(y * 0.013 - seed * 0.7) *
					Math.sin((x + y) * 0.004 + seed * 2);
			const r = pitch * 0.5 * Math.sqrt(0.04 + 0.16 * n);
			ctx.moveTo(x + r, y);
			ctx.arc(x, y, r, 0, Math.PI * 2);
		}
	}
	ctx.fill();
}

/** A shaded sphere as halftone dots. The grid is fixed, so dots don't swim as the sphere moves. */
export function halftoneDisc(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	radius: number,
	color: string,
	pitch: number
) {
	ctx.fillStyle = color;
	ctx.beginPath();
	for (const dot of halftoneDots(x, y, radius, pitch)) {
		ctx.moveTo(dot.cx + dot.r, dot.cy);
		ctx.arc(dot.cx, dot.cy, dot.r, 0, Math.PI * 2);
	}
	ctx.fill();
}

/** The dots of a halftone sphere, for drawing it in SVG as well as on a canvas. */
export function halftoneDots(x: number, y: number, radius: number, pitch: number) {
	const dots: { cx: number; cy: number; r: number }[] = [];
	const x0 = Math.floor((x - radius) / pitch) * pitch;
	const y0 = Math.floor((y - radius) / pitch) * pitch;
	for (let gy = y0; gy <= y + radius; gy += pitch) {
		for (let gx = x0; gx <= x + radius; gx += pitch) {
			const cx = gx + pitch / 2;
			const cy = gy + pitch / 2;
			const dx = (cx - x) / radius;
			const dy = (cy - y) / radius;
			const d2 = dx * dx + dy * dy;
			if (d2 > 1) continue;
			const light = Math.min(
				1,
				Math.max(0.1, 0.3 - dx * 0.35 - dy * 0.45 + Math.sqrt(1 - d2) * 0.65)
			);
			dots.push({ cx, cy, r: pitch * 0.5 * Math.sqrt(light) * 1.04 });
		}
	}
	return dots;
}
