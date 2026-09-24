// The collision tests from the collision-detection book, for its interactive figures, so each demo
// runs the same code its chapter shows.

export type Point = { x: number; y: number };
export type Circle = { x: number; y: number; r: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Line = { a: number; b: number; c: number };
export type Polygon = Point[];

export const subtract = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
export const dot = (u: Point, v: Point) => u.x * v.x + u.y * v.y;
export const distanceSquared = (a: Point, b: Point) => (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
export const clamp = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));
export const overlap = (a1: number, a2: number, b1: number, b2: number) => a1 <= b2 && b1 <= a2;
export const normalize = (v: Point): Point => {
	const length = Math.hypot(v.x, v.y) || 1;
	return { x: v.x / length, y: v.y / length };
};
export const pointInCircle = (p: Point, c: Circle) => distanceSquared(p, c) <= c.r ** 2;

// Lines and segments.
export const lineThrough = (p1: Point, p2: Point): Line => ({
	a: p2.y - p1.y,
	b: p1.x - p2.x,
	c: p2.x * p1.y - p1.x * p2.y
});
/** ax + by + c for the point: 0 on the line, and its sign says which side. */
export const side = (p: Point, line: Line) => line.a * p.x + line.b * p.y + line.c;

/** Where the projection of p lands on the line through a and b: 0 at a, 1 at b. */
export function projectionT(p: Point, a: Point, b: Point) {
	const d = subtract(b, a);
	const lengthSquared = dot(d, d);
	return lengthSquared === 0 ? 0 : dot(subtract(p, a), d) / lengthSquared;
}
export function closestPointOnSegment(p: Point, a: Point, b: Point): Point {
	const t = clamp(projectionT(p, a, b), 0, 1);
	return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
}
export const circleSegmentCollide = (c: Circle, a: Point, b: Point) =>
	pointInCircle(closestPointOnSegment(c, a, b), c);
export const lineSegmentCollide = (line: Line, a: Point, b: Point) =>
	side(a, line) * side(b, line) <= 0;

export function segmentsIntersect(a: Point, b: Point, c: Point, d: Point) {
	const ab = lineThrough(a, b);
	const sc = side(c, ab);
	const sd = side(d, ab);
	if (sc === 0 && sd === 0) {
		// All four on one line: they meet only if they overlap along it.
		return (
			overlap(Math.min(a.x, b.x), Math.max(a.x, b.x), Math.min(c.x, d.x), Math.max(c.x, d.x)) &&
			overlap(Math.min(a.y, b.y), Math.max(a.y, b.y), Math.min(c.y, d.y), Math.max(c.y, d.y))
		);
	}
	const cd = lineThrough(c, d);
	return sc * sd <= 0 && side(a, cd) * side(b, cd) <= 0;
}

/** Where segment ab meets the line through c and d; call it once they're known to meet. */
export function crossingPoint(a: Point, b: Point, c: Point, d: Point): Point {
	const cd = lineThrough(c, d);
	const sa = side(a, cd);
	const sb = side(b, cd);
	const t = sa === sb ? 0 : sa / (sa - sb);
	return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
}

// Polygons.
export const edges = (polygon: Polygon): [Point, Point][] =>
	polygon.map((a, i) => [a, polygon[(i + 1) % polygon.length]]);
export const axes = (polygon: Polygon): Point[] =>
	edges(polygon).map(([p1, p2]) => ({ x: p2.y - p1.y, y: p1.x - p2.x }));
export function project(polygon: Polygon, axis: Point): [number, number] {
	const values = polygon.map((vertex) => dot(vertex, axis));
	return [Math.min(...values), Math.max(...values)];
}
export const rectToPolygon = (rect: Rect): Polygon => [
	{ x: rect.x, y: rect.y },
	{ x: rect.x + rect.w, y: rect.y },
	{ x: rect.x + rect.w, y: rect.y + rect.h },
	{ x: rect.x, y: rect.y + rect.h }
];

/**
 * The separating axis test between a convex polygon and a convex polygon (or segment) or a circle,
 * axis by axis, for drawing. Axes are unit length, so a circle's shadow is its centre ± r.
 * overlap > 0 is how far the shadows overlap on that axis; < 0 is the size of the gap.
 */
export function separatingAxes(polygon: Polygon, other: Polygon | Circle) {
	const circle = 'r' in other ? other : undefined;
	let candidates: Point[];
	if (circle) {
		const nearest = polygon.reduce((best, v) =>
			distanceSquared(v, circle) < distanceSquared(best, circle) ? v : best
		);
		candidates = [...axes(polygon), subtract(nearest, circle)];
	} else {
		candidates = [...axes(polygon), ...axes(other as Polygon)];
	}
	return candidates.map(normalize).map((axis) => {
		const a = project(polygon, axis);
		const centre = circle ? dot(circle, axis) : 0;
		const b: [number, number] = circle
			? [centre - circle.r, centre + circle.r]
			: project(other as Polygon, axis);
		return { axis, a, b, overlap: Math.min(a[1], b[1]) - Math.max(a[0], b[0]) };
	});
}
export const convexPolygonsCollide = (a: Polygon, b: Polygon) =>
	separatingAxes(a, b).every((test) => test.overlap >= 0);

export function pointInConvexPolygon(p: Point, polygon: Polygon) {
	let positive = false;
	let negative = false;
	for (const [a, b] of edges(polygon)) {
		const value = side(p, lineThrough(a, b));
		if (value > 0) positive = true;
		if (value < 0) negative = true;
	}
	return !(positive && negative);
}

export function polygonLineCollide(polygon: Polygon, line: Line) {
	const values = polygon.map((vertex) => side(vertex, line));
	return Math.min(...values) <= 0 && Math.max(...values) >= 0;
}

/** Ray casting: an odd number of edges crossed on the way right means inside. */
export function pointInPolygon(p: Point, polygon: Polygon) {
	let inside = false;
	for (const [a, b] of edges(polygon)) {
		if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
			inside = !inside;
		}
	}
	return inside;
}

/** The points where the ray from p to the right crosses the polygon's edges. */
export function rayCrossings(p: Point, polygon: Polygon): Point[] {
	return edges(polygon)
		.filter(([a, b]) => a.y > p.y !== b.y > p.y)
		.map(([a, b]) => ({ x: ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x, y: p.y }))
		.filter((crossing) => p.x < crossing.x);
}
