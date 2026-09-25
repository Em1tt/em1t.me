// The 20 mutants for X2: each is one small edit to src/semver.js that introduces a bug.
// `find` must occur exactly once in the original.
export const MUTANTS = [
	{ id: 'M01', what: 'numeric pre-release identifiers compared as strings', find: "if (aNumber && bNumber) return a === b ? 0 : a < b ? -1 : 1;", replace: "if (aNumber && bNumber) return String(a) === String(b) ? 0 : String(a) < String(b) ? -1 : 1;" },
	{ id: 'M02', what: 'a pre-release ranks above the release', find: "if (!a.prerelease.length) return 1;\n\tif (!b.prerelease.length) return -1;", replace: "if (!a.prerelease.length) return -1;\n\tif (!b.prerelease.length) return 1;" },
	{ id: 'M03', what: 'the longer pre-release ranks lower', find: "if (i >= a.prerelease.length) return -1;", replace: "if (i >= a.prerelease.length) return 1;" },
	{ id: 'M04', what: 'numeric identifiers rank above alphanumeric ones', find: "if (aNumber) return -1;\n\tif (bNumber) return 1;", replace: "if (aNumber) return 1;\n\tif (bNumber) return -1;" },
	{ id: 'M05', what: 'leading zeros allowed in the major version', find: "^v?(0|[1-9]\\d*)\\.(0|", replace: "^v?(\\d+)\\.(0|" },
	{ id: 'M06', what: 'the patch number is optional', find: "\\.(0|[1-9]\\d*)(?:-(", replace: "(?:\\.(0|[1-9]\\d*))?(?:-(" },
	{ id: 'M07', what: '^0.2.3 allows 0.x.x up to 1.0.0', find: "minor > 0 ? version(0, minor + 1, 0)", replace: "minor > 0 ? version(major + 1, 0, 0)" },
	{ id: 'M08', what: '^0.0.3 allows up to 0.1.0', find: ": version(0, 0, patch + 1);", replace: ": version(0, minor + 1, 0);" },
	{ id: 'M09', what: '~1.2.3 allows up to 2.0.0', find: "if (operator === '~') return [['>=', exact], ['<', version(major, minor + 1, 0)]];", replace: "if (operator === '~') return [['>=', exact], ['<', version(major + 1, 0, 0)]];" },
	{ id: 'M10', what: '>= behaves like >', find: "if (operator === '>=') return c >= 0;", replace: "if (operator === '>=') return c > 0;" },
	{ id: 'M11', what: '< behaves like <=', find: "if (operator === '<') return c < 0;", replace: "if (operator === '<') return c <= 0;" },
	{ id: 'M12', what: '1.2.x allows up to 2.0.0', find: "const upper = minor === null ? version(major + 1, 0, 0) : version(major, minor + 1, 0);", replace: "const upper = version(major + 1, 0, 0);" },
	{ id: 'M13', what: '>1.2 excludes 1.3.0', find: "if (operator === '>') return [['>=', upper]];", replace: "if (operator === '>') return [['>', upper]];" },
	{ id: 'M14', what: 'only the first || alternative counts', find: ".split('||')", replace: ".split('||').slice(0, 1)" },
	{ id: 'M15', what: 'one comparator in a set is enough', find: "if (!conditions.every((condition) => test(v, condition))) return false;", replace: "if (!conditions.some((condition) => test(v, condition)) && conditions.length) return false;" },
	{ id: 'M16', what: 'pre-releases satisfy any range', find: "return conditions.some(([, b]) => b.prerelease.length && b.major === v.major && b.minor === v.minor && b.patch === v.patch);", replace: "return true;" },
	{ id: 'M17', what: 'pre-releases match a pre-release comparator on any version', find: "b.prerelease.length && b.major === v.major && b.minor === v.minor && b.patch === v.patch", replace: "b.prerelease.length" },
	{ id: 'M18', what: 'maxSatisfying returns the lowest match', find: "compare(v, best) > 0", replace: "compare(v, best) < 0" },
	{ id: 'M19', what: 'build metadata is rejected', find: "(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$/;", replace: "$/;" },
	{ id: 'M20', what: 'numeric pre-release identifiers stay strings', find: "prerelease: m[4] ? m[4].split('.').map((id) => (/^\\d+$/.test(id) ? Number(id) : id)) : []", replace: "prerelease: m[4] ? m[4].split('.') : []" }
];

export function mutate(source, mutant) {
	const count = source.split(mutant.find).length - 1;
	if (count !== 1) throw new Error(`${mutant.id}: find occurs ${count} times`);
	return source.replace(mutant.find, mutant.replace);
}
