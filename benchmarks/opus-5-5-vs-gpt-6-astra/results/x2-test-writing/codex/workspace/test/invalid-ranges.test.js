import { test } from 'node:test';
import assert from 'node:assert/strict';
import { satisfies } from '../src/semver.js';

test('invalid versions return false for valid ranges', () => {
	const invalidVersions = [
		'', ' ', 'garbage', '1', '1.2', '1.2.3.4', '01.2.3', '1.02.3', '1.2.03',
		'1.2.3-01', '1.2.3-alpha..1', '1.2.3-', '1.2.3+', '1.2.3+bad_metadata',
		null, undefined, 123, 0, NaN, true, false, {}, [], ['1.2.3'],
		{ major: 1, minor: 2, patch: 3, prerelease: [] },
		{ toString: () => '1.2.3' }, new String('1.2.3'), Symbol('version'), 123n,
	];
	for (const version of invalidVersions) {
		for (const range of ['', '*', '1.2.3', '>=1.0.0 <2.0.0', '1 || 2', '>=1.2.3-alpha']) {
			assert.equal(satisfies(version, range), false, `invalid version in ${range}`);
		}
	}
});

test('malformed range comparators throw TypeError', () => {
	const invalidRanges = [
		'banana', '1..2', '.1.2', '1.2.', '1.2.3.4', '-1.2.3', '1.-2.3', '1.2.-3',
		'1a2', '1a2.3', '1.2a3', '1/2.3', '1.2/3',
		'01', '01.2', '1.02', '01.2.3', '1.02.3', '1.2.03',
		'!', '!=1.2.3', '==1.2.3', '=>1.2.3', '=<1.2.3', '>>1.2.3', '<<1.2.3',
		'^', '~', '>', '>=', '<', '<=', '=', '1.2.3-', '1.2.3-alpha_1',
		'1.2.3 | 2.0.0', '1.2.3 ||| 2.0.0', '>=1.0.0, <2.0.0',
	];
	for (const range of invalidRanges) {
		assert.throws(() => satisfies('1.2.3', range), TypeError, range);
	}
});

test('invalid comparators are rejected throughout a compound range', () => {
	for (const range of [
		'1.2.3 banana', 'banana 1.2.3', '>9.0.0 banana', 'banana >9.0.0',
		'* || banana', 'banana || *', '1.2.3 || banana', 'banana || 1.2.3',
		'1.0.0 || 1.2.3 || banana', '1.0.0 || banana || 1.2.3',
	]) {
		assert.throws(() => satisfies('1.2.3', range), TypeError, range);
	}
});
