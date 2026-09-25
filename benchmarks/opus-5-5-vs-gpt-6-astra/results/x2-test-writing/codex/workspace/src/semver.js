// A small subset of semantic versioning (https://semver.org), described in README.md.

const VERSION = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/** '1.2.3-beta.1' → { major: 1, minor: 2, patch: 3, prerelease: ['beta', 1] }, or null. */
export function parse(text) {
	if (typeof text !== 'string') return null;
	const m = VERSION.exec(text.trim());
	if (!m) return null;
	return {
		major: Number(m[1]),
		minor: Number(m[2]),
		patch: Number(m[3]),
		prerelease: m[4] ? m[4].split('.').map((id) => (/^\d+$/.test(id) ? Number(id) : id)) : []
	};
}

function compareIdentifiers(a, b) {
	const aNumber = typeof a === 'number';
	const bNumber = typeof b === 'number';
	if (aNumber && bNumber) return a === b ? 0 : a < b ? -1 : 1;
	if (aNumber) return -1;
	if (bNumber) return 1;
	return a === b ? 0 : a < b ? -1 : 1;
}

function compareParsed(a, b) {
	for (const key of ['major', 'minor', 'patch']) {
		if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1;
	}
	if (!a.prerelease.length && !b.prerelease.length) return 0;
	if (!a.prerelease.length) return 1;
	if (!b.prerelease.length) return -1;
	for (let i = 0; i < Math.max(a.prerelease.length, b.prerelease.length); i++) {
		if (i >= a.prerelease.length) return -1;
		if (i >= b.prerelease.length) return 1;
		const result = compareIdentifiers(a.prerelease[i], b.prerelease[i]);
		if (result !== 0) return result;
	}
	return 0;
}

/** -1, 0 or 1. Throws a TypeError if either version is invalid. */
export function compare(a, b) {
	const pa = parse(a);
	const pb = parse(b);
	if (!pa || !pb) throw new TypeError(`Invalid version: ${pa ? b : a}`);
	return compareParsed(pa, pb);
}

// A partial version in a range: 1, 1.2, 1.2.3, with x, X or * for any part.
const PARTIAL = /^v?(0|[1-9]\d*|[xX*])(?:\.(0|[1-9]\d*|[xX*])(?:\.(0|[1-9]\d*|[xX*])(?:-([0-9A-Za-z.-]+))?)?)?$/;
const WILD = (part) => part === undefined || part === 'x' || part === 'X' || part === '*';

function version(major, minor, patch, prerelease = []) {
	return { major, minor, patch, prerelease };
}

/** One comparator, like '^1.2.3', into a list of [operator, version] conditions. */
function expand(token) {
	const m = /^(\^|~|>=|<=|>|<|=)?(.*)$/.exec(token);
	const operator = m[1] ?? '';
	const p = PARTIAL.exec(m[2]);
	if (!p) throw new TypeError(`Invalid range: ${token}`);
	const [major, minor, patch] = [p[1], p[2], p[3]].map((x) => (WILD(x) ? null : Number(x)));
	const prerelease = p[4] ? p[4].split('.').map((id) => (/^\d+$/.test(id) ? Number(id) : id)) : [];
	if (major === null) return operator === '<' || operator === '>' ? [['<', version(0, 0, 0)]] : [];
	if (minor === null || patch === null) {
		const lower = version(major, minor ?? 0, 0);
		const upper = minor === null ? version(major + 1, 0, 0) : version(major, minor + 1, 0);
		if (operator === '>') return [['>=', upper]];
		if (operator === '<') return [['<', lower]];
		if (operator === '>=') return [['>=', lower]];
		if (operator === '<=') return [['<', upper]];
		return [['>=', lower], ['<', upper]];
	}
	const exact = version(major, minor, patch, prerelease);
	if (operator === '^') {
		const upper = major > 0 ? version(major + 1, 0, 0) : minor > 0 ? version(0, minor + 1, 0) : version(0, 0, patch + 1);
		return [['>=', exact], ['<', upper]];
	}
	if (operator === '~') return [['>=', exact], ['<', version(major, minor + 1, 0)]];
	return [[operator || '=', exact]];
}

function test(v, [operator, bound]) {
	const c = compareParsed(v, bound);
	if (operator === '=') return c === 0;
	if (operator === '>') return c > 0;
	if (operator === '>=') return c >= 0;
	if (operator === '<') return c < 0;
	return c <= 0;
}

/** Whether a version is in a range. Throws a TypeError for an invalid range; false for an invalid version. */
export function satisfies(text, range) {
	const v = parse(text);
	const sets = String(range)
		.split('||')
		.map((set) => set.trim().split(/\s+/).filter(Boolean).flatMap(expand));
	if (!v) return false;
	return sets.some((conditions) => {
		if (!conditions.every((condition) => test(v, condition))) return false;
		if (!v.prerelease.length) return true;
		// A pre-release only matches when the range names one on the same major.minor.patch.
		return conditions.some(([, b]) => b.prerelease.length && b.major === v.major && b.minor === v.minor && b.patch === v.patch);
	});
}

/** The highest version in the list that satisfies the range, or null. Invalid versions are skipped. */
export function maxSatisfying(versions, range) {
	let best = null;
	for (const v of versions) {
		if (satisfies(v, range) && (best === null || compare(v, best) > 0)) best = v;
	}
	return best;
}
