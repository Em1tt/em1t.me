/** A point on a canvas demo: a plain filled circle, never dithered. */
export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
	ctx.fill();
}
