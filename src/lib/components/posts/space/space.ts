// The collision tests from Part II of the collision-detection book, for its 3D figures, so each
// figure runs the same code its chapter shows.

export type Vec3 = { x: number; y: number; z: number };
export type Sphere = Vec3 & { r: number };
export type Box = { x: number; y: number; z: number; w: number; h: number; d: number };
export type Plane = { a: number; b: number; c: number; d: number };

export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const subtract = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const scale = (v: Vec3, k: number): Vec3 => ({ x: v.x * k, y: v.y * k, z: v.z * k });
export const dot = (u: Vec3, v: Vec3) => u.x * v.x + u.y * v.y + u.z * v.z;
export const cross = (u: Vec3, v: Vec3): Vec3 => ({
	x: u.y * v.z - u.z * v.y,
	y: u.z * v.x - u.x * v.z,
	z: u.x * v.y - u.y * v.x
});
export const length = (v: Vec3) => Math.hypot(v.x, v.y, v.z);
export const normalize = (v: Vec3): Vec3 => scale(v, 1 / (length(v) || 1));
export const distanceSquared = (a: Vec3, b: Vec3) => dot(subtract(b, a), subtract(b, a));
export const midpoint = (a: Vec3, b: Vec3): Vec3 => scale(add(a, b), 1 / 2);
export const clamp = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));
export const overlap = (a1: number, a2: number, b1: number, b2: number) => a1 <= b2 && b1 <= a2;
/** The point t steps of `direction` from `origin`. */
export const along = (origin: Vec3, direction: Vec3, t: number) => add(origin, scale(direction, t));

// Spheres.
export const pointInSphere = (p: Vec3, s: Sphere) => distanceSquared(p, s) <= s.r ** 2;
export const spheresCollide = (a: Sphere, b: Sphere) => distanceSquared(a, b) <= (a.r + b.r) ** 2;

// Boxes.
export const boxMin = (box: Box): Vec3 => ({ x: box.x, y: box.y, z: box.z });
export const boxMax = (box: Box): Vec3 => ({
	x: box.x + box.w,
	y: box.y + box.h,
	z: box.z + box.d
});
export const boxCentre = (box: Box): Vec3 => midpoint(boxMin(box), boxMax(box));
export const pointInBox = (p: Vec3, box: Box) =>
	overlap(p.x, p.x, box.x, box.x + box.w) &&
	overlap(p.y, p.y, box.y, box.y + box.h) &&
	overlap(p.z, p.z, box.z, box.z + box.d);
export const boxesCollide = (a: Box, b: Box) =>
	overlap(a.x, a.x + a.w, b.x, b.x + b.w) &&
	overlap(a.y, a.y + a.h, b.y, b.y + b.h) &&
	overlap(a.z, a.z + a.d, b.z, b.z + b.d);
export const closestPointInBox = (p: Vec3, box: Box): Vec3 => ({
	x: clamp(p.x, box.x, box.x + box.w),
	y: clamp(p.y, box.y, box.y + box.h),
	z: clamp(p.z, box.z, box.z + box.d)
});
export const sphereBoxCollide = (s: Sphere, box: Box) =>
	pointInSphere(closestPointInBox(s, box), s);

// Planes.
export const normalOf = (plane: Plane): Vec3 => ({ x: plane.a, y: plane.b, z: plane.c });
export const planeAt = (point: Vec3, normal: Vec3): Plane => ({
	a: normal.x,
	b: normal.y,
	c: normal.z,
	d: -dot(normal, point)
});
export const planeThrough = (a: Vec3, b: Vec3, c: Vec3) =>
	planeAt(a, cross(subtract(b, a), subtract(c, a)));
/** ax + by + cz + d for the point: 0 on the plane, and its sign says which side. */
export const side = (p: Vec3, plane: Plane) =>
	plane.a * p.x + plane.b * p.y + plane.c * p.z + plane.d;
export const distanceToPlane = (p: Vec3, plane: Plane) =>
	Math.abs(side(p, plane)) / length(normalOf(plane));
/** The point of the plane closest to p: the foot of the perpendicular from p. */
export const closestPointOnPlane = (p: Vec3, plane: Plane) =>
	along(p, normalOf(plane), -side(p, plane) / dot(normalOf(plane), normalOf(plane)));
export const spherePlaneCollide = (s: Sphere, plane: Plane) =>
	side(s, plane) ** 2 <= s.r ** 2 * dot(normalOf(plane), normalOf(plane));
/** How far the box reaches along the plane's normal from its centre, in the units of side(). */
export const boxReach = (box: Box, plane: Plane) =>
	(box.w / 2) * Math.abs(plane.a) +
	(box.h / 2) * Math.abs(plane.b) +
	(box.d / 2) * Math.abs(plane.c);
export const boxPlaneCollide = (box: Box, plane: Plane) =>
	Math.abs(side(boxCentre(box), plane)) <= boxReach(box, plane);

// Segments and rays.
export function segmentT(p: Vec3, a: Vec3, b: Vec3) {
	const d = subtract(b, a);
	const lengthSquared = dot(d, d);
	return lengthSquared === 0 ? 0 : dot(subtract(p, a), d) / lengthSquared;
}
export const closestPointOnSegment = (p: Vec3, a: Vec3, b: Vec3) =>
	along(a, subtract(b, a), clamp(segmentT(p, a, b), 0, 1));
export const sphereSegmentCollide = (s: Sphere, a: Vec3, b: Vec3) =>
	pointInSphere(closestPointOnSegment(s, a, b), s);

/** Where segment ab crosses the plane, or null when both ends are on the same side. */
export function segmentPlane(a: Vec3, b: Vec3, plane: Plane) {
	const sa = side(a, plane);
	const sb = side(b, plane);
	if (sa * sb > 0) return null;
	const t = sa === sb ? 0 : sa / (sa - sb);
	return along(a, subtract(b, a), t);
}

/** How far along the ray it meets the plane, or null if it never does. */
export function rayPlane(origin: Vec3, direction: Vec3, plane: Plane) {
	const facing = dot(normalOf(plane), direction);
	if (facing === 0) return null;
	const t = -side(origin, plane) / facing;
	return t >= 0 ? t : null;
}

/** Both places the ray's line meets the sphere, nearest first, or null if it misses. */
export function raySphereRoots(origin: Vec3, direction: Vec3, s: Sphere) {
	const m = subtract(origin, s);
	const a = dot(direction, direction);
	const b = dot(m, direction);
	const c = dot(m, m) - s.r ** 2;
	const discriminant = b * b - a * c;
	if (discriminant < 0) return null;
	const root = Math.sqrt(discriminant);
	return [(-b - root) / a, (-b + root) / a] as const;
}
export function raySphere(origin: Vec3, direction: Vec3, s: Sphere) {
	const m = subtract(origin, s);
	const a = dot(direction, direction);
	const b = dot(m, direction);
	const c = dot(m, m) - s.r ** 2;
	if (c > 0 && b > 0) return null;
	const discriminant = b * b - a * c;
	if (discriminant < 0) return null;
	return Math.max((-b - Math.sqrt(discriminant)) / a, 0);
}

/** The slab method: each axis's t-interval, where the ray enters and leaves the box, or null. */
export function rayBoxSlabs(origin: Vec3, direction: Vec3, box: Box) {
	const axes = [
		['x', box.x, box.w],
		['y', box.y, box.h],
		['z', box.z, box.d]
	] as const;
	const slabs = axes.map(([axis, min, size]) => {
		const o = origin[axis];
		const d = direction[axis];
		if (d === 0) return o < min || o > min + size ? null : ([-Infinity, Infinity] as const);
		const t1 = (min - o) / d;
		const t2 = (min + size - o) / d;
		return [Math.min(t1, t2), Math.max(t1, t2)] as const;
	});
	let near = 0;
	let far = Infinity;
	for (const slab of slabs) {
		if (!slab) return { slabs, hit: null };
		near = Math.max(near, slab[0]);
		far = Math.min(far, slab[1]);
	}
	return { slabs, hit: near <= far ? ([near, far] as const) : null };
}
export const rayBox = (origin: Vec3, direction: Vec3, box: Box) =>
	rayBoxSlabs(origin, direction, box).hit?.[0] ?? null;
