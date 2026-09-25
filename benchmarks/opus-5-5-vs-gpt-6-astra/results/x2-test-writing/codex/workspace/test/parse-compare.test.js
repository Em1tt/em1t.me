import test from 'node:test';
import assert from 'node:assert/strict';
import { parse, compare } from '../src/semver.js';

test('parse returns exactly the numeric components and typed prerelease identifiers', () => {
	const cases = [
		['0.0.0', { major: 0, minor: 0, patch: 0, prerelease: [] }],
		['1.2.3', { major: 1, minor: 2, patch: 3, prerelease: [] }],
		['10.20.30', { major: 10, minor: 20, patch: 30, prerelease: [] }],
		['2147483648.1234567890.987654321', { major: 2147483648, minor: 1234567890, patch: 987654321, prerelease: [] }],
		['0.2.0', { major: 0, minor: 2, patch: 0, prerelease: [] }],
		['v1.2.3', { major: 1, minor: 2, patch: 3, prerelease: [] }],
		[' \t\r\nv12.34.56\n\r\t ', { major: 12, minor: 34, patch: 56, prerelease: [] }],
		['\u00a0\v\f0.0.1\u00a0', { major: 0, minor: 0, patch: 1, prerelease: [] }],
		['1.2.3-beta.10', { major: 1, minor: 2, patch: 3, prerelease: ['beta', 10] }],
		['1.2.3-0.1.10.123', { major: 1, minor: 2, patch: 3, prerelease: [0, 1, 10, 123] }],
		['1.2.3-2147483648.4294967296', { major: 1, minor: 2, patch: 3, prerelease: [2147483648, 4294967296] }],
		['1.2.3-Alpha.Z.a-z.0a.01a.01-.a01.-', { major: 1, minor: 2, patch: 3, prerelease: ['Alpha', 'Z', 'a-z', '0a', '01a', '01-', 'a01', '-'] }],
		['1.2.3+build.5', { major: 1, minor: 2, patch: 3, prerelease: [] }],
		['1.2.3+000.01.A-z.-', { major: 1, minor: 2, patch: 3, prerelease: [] }],
		[' v12.34.56-rc.0+build.007 ', { major: 12, minor: 34, patch: 56, prerelease: ['rc', 0] }],
	];
	for (const [text, expected] of cases) {
		assert.deepEqual(parse(text), expected, JSON.stringify(text));
	}
});

test('parse requires a complete version and rejects malformed core numbers', () => {
	const invalid = [
		'', ' ', '\t\n', 'v', '1', '1.2', '1.2.3.4',
		'.2.3', '1..3', '1.2.', '..', '1.2.3.',
		'01.2.3', '1.02.3', '1.2.03', '00.0.0', '0.00.0', '0.0.00',
		'-1.2.3', '1.-2.3', '1.2.-3', '+1.2.3', '1.+2.3', '1.2.+3',
		'1e1.2.3', '1.2e1.3', '1.2.3e1', '0x1.2.3', 'NaN.2.3', 'Infinity.2.3',
		'1a2b3', '1a2.3', '1.2a3', '1/2.3', '1.2/3', '1/2/3', '1,2,3', '1_2_3',
		'V1.2.3', 'vv1.2.3', '=1.2.3', 'version1.2.3', '1.2.3suffix',
		'v 1.2.3', '1 .2.3', '1. 2.3', '1.2 .3', '1.2. 3',
		'1.2.3 4.5.6', '1.2.3\n4.5.6', '1.2.3\0',
		'１.2.3', '1.٢.3', '1.2.３',
	];
	for (const text of invalid) assert.equal(parse(text), null, JSON.stringify(text));
});

test('parse rejects empty, malformed, and zero-padded prerelease identifiers', () => {
	const invalid = [
		'1.2.3-', '1.2.3-.', '1.2.3-.alpha', '1.2.3-alpha.', '1.2.3-alpha..beta',
		'1.2.3-01', '1.2.3-00', '1.2.3-001', '1.2.3-alpha.01',
		'1.2.3-01.alpha', '1.2.3-0.00.1', '1.2.3-alpha.01+build',
		'1.2.3-alpha_beta', '1.2.3-alpha/beta', '1.2.3-alpha:beta',
		'1.2.3-α', '1.2.3-é', '1.2.3-١', '1.2.3-💫',
		'1.2.3- alpha', '1.2.3-alpha beta', '1.2.3-alpha\nbeta',
		'1.2.3 -alpha', '1.2.3-+build',
	];
	for (const text of invalid) assert.equal(parse(text), null, JSON.stringify(text));
});

test('parse validates build identifiers even though it discards the metadata', () => {
	const invalid = [
		'1.2.3+', '1.2.3+.', '1.2.3+.build', '1.2.3+build.', '1.2.3+build..5',
		'1.2.3+build+5', '1.2.3++build', '1.2.3+build_5', '1.2.3+build/5',
		'1.2.3+é', '1.2.3+١', '1.2.3+build 5', '1.2.3+ build',
		'1.2.3 +build', '1.2.3-alpha+', '1.2.3-alpha+build..5',
	];
	for (const text of invalid) assert.equal(parse(text), null, JSON.stringify(text));
});

test('parse returns null for non-strings without coercing them', () => {
	const values = [
		undefined, null, true, false, 0, 123, NaN, Infinity, 123n,
		Symbol('1.2.3'), {}, [], ['1.2.3'], new String('1.2.3'),
		{ major: 1, minor: 2, patch: 3, prerelease: [] },
		{ toString() { throw new Error('parse must not coerce an object'); } },
		() => '1.2.3',
	];
	for (const value of values) assert.equal(parse(value), null);
});

function assertLower(lower, higher) {
	assert.equal(compare(lower, higher), -1, `${JSON.stringify(lower)} < ${JSON.stringify(higher)}`);
	assert.equal(compare(higher, lower), 1, `${JSON.stringify(higher)} > ${JSON.stringify(lower)}`);
}

test('compare orders major, minor, then patch numerically before prerelease', () => {
	const orderedPairs = [
		['0.0.0', '1.0.0'],
		['2.999.999', '10.0.0'],
		['1.2.999', '1.10.0'],
		['1.2.9', '1.2.10'],
		['1.9.9', '2.0.0'],
		['1.0.999', '1.1.0'],
		['1.2.0', '1.2.1'],
		['1.0.0', '2.0.0-alpha'],
		['1.0.0', '1.1.0-alpha'],
		['1.0.0', '1.0.1-alpha'],
		['1.2.3-z', '1.2.4-a'],
	];
	for (const [lower, higher] of orderedPairs) assertLower(lower, higher);
});

test('compare implements every step of the documented prerelease ordering', () => {
	const versions = [
		'1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-alpha.beta', '1.0.0-beta',
		'1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0',
	];
	for (let i = 0; i < versions.length; i++) {
		assert.equal(compare(versions[i], versions[i]), 0, versions[i]);
		for (let j = i + 1; j < versions.length; j++) assertLower(versions[i], versions[j]);
	}
});

test('compare uses numeric precedence, ASCII string order, and identifier list length', () => {
	const orderedPairs = [
		['1.0.0-0', '1.0.0-1'],
		['1.0.0-2', '1.0.0-10'],
		['1.0.0-alpha.2', '1.0.0-alpha.10'],
		['1.0.0-999', '1.0.0--'],
		['1.0.0-123', '1.0.0-0a'],
		['1.0.0-alpha.10', '1.0.0-alpha.2a'],
		['1.0.0--', '1.0.0-A'],
		['1.0.0-A', '1.0.0-Z'],
		['1.0.0-Z', '1.0.0-a'],
		['1.0.0-a', '1.0.0-z'],
		['1.0.0-12a', '1.0.0-2a'],
		['1.0.0-alpha', '1.0.0-alphabet'],
		['1.0.0-a-b', '1.0.0-a0'],
		['1.0.0-0', '1.0.0-0.0'],
		['1.0.0-alpha', '1.0.0-alpha.0'],
		['1.0.0-alpha.0', '1.0.0-alpha.0.0'],
		['1.0.0-alpha.0.1', '1.0.0-alpha.0.2'],
		['1.0.0-alpha.beta.a', '1.0.0-alpha.beta.b'],
		['1.0.0-alpha.2.z', '1.0.0-alpha.10.a'],
		['1.0.0-a.z.z', '1.0.0-b'],
		['1.0.0-0', '1.0.0'],
		['1.0.0--', '1.0.0'],
	];
	for (const [lower, higher] of orderedPairs) assertLower(lower, higher);
});

test('compare treats build metadata, surrounding whitespace, and leading v as insignificant', () => {
	const equivalentGroups = [
		['1.2.3', 'v1.2.3', ' \t1.2.3\n', '1.2.3+a', '1.2.3+b.01', ' v1.2.3+000 '],
		['1.2.3-alpha.0.10', 'v1.2.3-alpha.0.10', '1.2.3-alpha.0.10+z', ' 1.2.3-alpha.0.10+a '],
		['0.0.0-0', '0.0.0-0+1', '0.0.0-0+2'],
		['1.2.3-a-b.01a', '1.2.3-a-b.01a+build'],
	];
	for (const group of equivalentGroups) {
		for (const a of group) {
			for (const b of group) assert.equal(compare(a, b), 0, `${a} equals ${b}`);
		}
	}
	assertLower('1.2.3-alpha+z', '1.2.3+a');
	assertLower('1.2.3-alpha.2+z', '1.2.3-alpha.10+a');
	assertLower('1.2.3+z', '1.2.4+a');
});

test('compare throws TypeError for an invalid argument in either position', () => {
	const invalid = [
		'', '1.2', '01.2.3', '1.02.3', '1.2.03', '1.2.3-01',
		'1.2.3-alpha..1', '1.2.3+', '1.2.3+bad_name', 'nonsense',
		undefined, null, 123, false, {}, [], ['1.2.3'], new String('1.2.3'),
	];
	for (const value of invalid) {
		assert.throws(() => compare(value, '1.2.3'), TypeError);
		assert.throws(() => compare('1.2.3', value), TypeError);
		assert.throws(() => compare(value, value), TypeError);
	}
	assert.throws(() => compare(), TypeError);
	assert.throws(() => compare('1.2.3'), TypeError);
});
