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

// Triangles.
export type Triangle = { a: Vec3; b: Vec3; c: Vec3 };
export const triangleNormal = (tri: Triangle) =>
	cross(subtract(tri.b, tri.a), subtract(tri.c, tri.a));
/** Per edge (AB, BC, CA): which side of it p is on, positive inside, as the book's test sees it. */
export function edgeSides(p: Vec3, tri: Triangle) {
	const n = triangleNormal(tri);
	return [
		dot(cross(subtract(tri.b, tri.a), subtract(p, tri.a)), n),
		dot(cross(subtract(tri.c, tri.b), subtract(p, tri.b)), n),
		dot(cross(subtract(tri.a, tri.c), subtract(p, tri.c)), n)
	];
}
export const pointInTriangle = (p: Vec3, tri: Triangle) =>
	edgeSides(p, tri).every((value) => value >= 0);
export function rayTriangle(origin: Vec3, direction: Vec3, tri: Triangle) {
	const t = rayPlane(origin, direction, planeThrough(tri.a, tri.b, tri.c));
	if (t === null) return null;
	return pointInTriangle(along(origin, direction, t), tri) ? t : null;
}
export function closestPointOnTriangle(p: Vec3, tri: Triangle) {
	const n = triangleNormal(tri);
	const lengthSquared = dot(n, n);
	if (lengthSquared > 0) {
		const onPlane = along(p, n, -side(p, planeAt(tri.a, n)) / lengthSquared);
		if (pointInTriangle(onPlane, tri)) return onPlane;
	}
	return [
		closestPointOnSegment(p, tri.a, tri.b),
		closestPointOnSegment(p, tri.b, tri.c),
		closestPointOnSegment(p, tri.c, tri.a)
	].reduce((best, q) => (distanceSquared(p, q) < distanceSquared(p, best) ? q : best));
}
export const sphereTriangleCollide = (s: Sphere, tri: Triangle) =>
	pointInSphere(closestPointOnTriangle(s, tri), s);

// Polygons into triangles.
export type Polygon = Vec3[];
/** The fan's triangle normals added up: along the normal, twice the area long. */
export function polygonNormal(polygon: Polygon) {
	let normal = { x: 0, y: 0, z: 0 };
	for (let i = 1; i + 1 < polygon.length; i++) {
		normal = add(
			normal,
			cross(subtract(polygon[i], polygon[0]), subtract(polygon[i + 1], polygon[0]))
		);
	}
	return normal;
}
export function fan(polygon: Polygon): Triangle[] {
	const triangles: Triangle[] = [];
	for (let i = 1; i + 1 < polygon.length; i++) {
		triangles.push({ a: polygon[0], b: polygon[i], c: polygon[i + 1] });
	}
	return triangles;
}
/** Whether the corner at `corner` turns the same way as the polygon: not dented inwards. */
export const isConvexCorner = (before: Vec3, corner: Vec3, after: Vec3, normal: Vec3) =>
	dot(cross(subtract(corner, before), subtract(after, corner)), normal) > 0;
/** Ear clipping, one ear at a time: each step's triangle, and the index of its corner. */
export function earClipSteps(polygon: Polygon) {
	const normal = polygonNormal(polygon);
	const corners = polygon.map((p, index) => ({ p, index }));
	const steps: { triangle: Triangle; corner: number }[] = [];
	let i = 0;
	let tries = 0;
	while (corners.length > 3 && tries < corners.length) {
		const before = (i + corners.length - 1) % corners.length;
		const after = (i + 1) % corners.length;
		const ear = { a: corners[before].p, b: corners[i].p, c: corners[after].p };
		const isEar =
			isConvexCorner(ear.a, ear.b, ear.c, normal) &&
			!corners.some(
				(other, j) => j !== before && j !== i && j !== after && pointInTriangle(other.p, ear)
			);
		if (isEar) {
			steps.push({ triangle: ear, corner: corners[i].index });
			corners.splice(i, 1);
			i %= corners.length;
			tries = 0;
		} else {
			i = (i + 1) % corners.length;
			tries++;
		}
	}
	if (corners.length === 3) {
		steps.push({
			triangle: { a: corners[0].p, b: corners[1].p, c: corners[2].p },
			corner: corners[1].index
		});
	}
	return steps;
}
export const earClip = (polygon: Polygon) => earClipSteps(polygon).map((step) => step.triangle);
export function rayTriangles(origin: Vec3, direction: Vec3, triangles: Triangle[]) {
	let nearest: number | null = null;
	for (const tri of triangles) {
		const t = rayTriangle(origin, direction, tri);
		if (t !== null && (nearest === null || t < nearest)) nearest = t;
	}
	return nearest;
}
export const sphereTrianglesCollide = (s: Sphere, triangles: Triangle[]) =>
	triangles.some((tri) => sphereTriangleCollide(s, tri));

// The separating axis test in 3D.
export type ConvexShape = { vertices: Vec3[]; normals: Vec3[]; edges: Vec3[] };
export type OrientedBox = {
	centre: Vec3;
	axes: [Vec3, Vec3, Vec3];
	half: [number, number, number];
};
export function projectOnto(vertices: Vec3[], axis: Vec3): [number, number] {
	const values = vertices.map((vertex) => dot(vertex, axis));
	return [Math.min(...values), Math.max(...values)];
}
/** Every axis the test tries, in order, with where it came from, and whether it shows a gap. */
export function separatingAxes3(a: ConvexShape, b: ConvexShape, names = ['A', 'B']) {
	const [nameA, nameB] = names;
	const candidates = [
		...a.normals.map((axis, i) => ({ axis, from: `${nameA}’s face normal ${i + 1}` })),
		...b.normals.map((axis, i) => ({ axis, from: `${nameB}’s face normal ${i + 1}` })),
		...a.edges.flatMap((u, i) =>
			b.edges.map((v, j) => ({
				axis: cross(u, v),
				from: `${nameA}’s edge ${i + 1} × ${nameB}’s edge ${j + 1}`
			}))
		)
	].filter(({ axis }) => dot(axis, axis) > 1e-9);
	return candidates.map((candidate) => {
		const shadowA = projectOnto(a.vertices, candidate.axis);
		const shadowB = projectOnto(b.vertices, candidate.axis);
		return {
			...candidate,
			shadowA,
			shadowB,
			gap: !overlap(shadowA[0], shadowA[1], shadowB[0], shadowB[1])
		};
	});
}
export const convexShapesCollide = (a: ConvexShape, b: ConvexShape) =>
	separatingAxes3(a, b).every((test) => !test.gap);
export function orientedBoxCorners(box: OrientedBox) {
	const [u, v, w] = box.axes;
	const [hu, hv, hw] = box.half;
	const corners: Vec3[] = [];
	for (const i of [-1, 1])
		for (const j of [-1, 1])
			for (const k of [-1, 1])
				corners.push(
					add(box.centre, add(scale(u, i * hu), add(scale(v, j * hv), scale(w, k * hw))))
				);
	return corners;
}
export const orientedBoxShape = (box: OrientedBox): ConvexShape => ({
	vertices: orientedBoxCorners(box),
	normals: [...box.axes],
	edges: [...box.axes]
});
export const triangleShape = (tri: Triangle): ConvexShape => ({
	vertices: [tri.a, tri.b, tri.c],
	normals: [triangleNormal(tri)],
	edges: [subtract(tri.b, tri.a), subtract(tri.c, tri.b), subtract(tri.a, tri.c)]
});
/** Axes turned `yaw` around y, then tilted `tilt` around the turned x-axis. */
export function turned(yaw: number, tilt = 0): [Vec3, Vec3, Vec3] {
	const [cy, sy, ct, st] = [Math.cos(yaw), Math.sin(yaw), Math.cos(tilt), Math.sin(tilt)];
	const x = { x: cy, y: 0, z: -sy };
	const up = { x: 0, y: 1, z: 0 };
	const z = { x: sy, y: 0, z: cy };
	return [x, add(scale(up, ct), scale(z, st)), add(scale(z, ct), scale(up, -st))];
}
