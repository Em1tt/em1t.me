import { test } from 'node:test';
import assert from 'node:assert/strict';
import { satisfies } from '../src/semver.js';

test('ordinary ranges exclude prereleases even when their numeric bounds match', () => {
	for (const range of ['', ' ', '*', 'x', '1', '1.x', '1.*', '1.2', '1.2.x', '^1.2.3', '~1.2.3', '>=0.0.0', '>1.2.3', '<2.0.0', '<=2.0.0', '>=1.0.0 <2.0.0']) {
		assert.equal(satisfies('1.2.4-alpha', range), false, range);
	}
	assert.equal(satisfies('0.0.0-0', '*'), false);
});

test('a prerelease bound admits only prereleases with the same complete core version', () => {
	const cases = [
		['1.2.3-beta.2', '>=1.2.3-beta.1', true],
		['1.2.3-beta.1', '>=1.2.3-beta.1', true],
		['1.2.3-beta.0', '>=1.2.3-beta.1', false],
		['1.2.3-alpha', '>=1.2.3-beta.1', false],
		['1.2.3', '>=1.2.3-beta.1', true],
		['1.2.4', '>=1.2.3-beta.1', true],
		['2.0.0', '>=1.2.3-beta.1', true],
		['1.2.4-beta.2', '>=1.2.3-beta.1', false],
		['1.3.3-beta.2', '>=1.2.3-beta.1', false],
		['2.2.3-beta.2', '>=1.2.3-beta.1', false],
		['2.3.4-beta.2', '>=1.2.3-beta.1', false],
		['1.2.2-beta.2', '<1.2.3-beta.9', false],
		['1.1.3-beta.2', '<1.2.3-beta.9', false],
		['0.2.3-beta.2', '<1.2.3-beta.9', false],
		['1.2.3-beta.2', '<1.2.3-beta.9', true],
		['1.2.3-beta.9', '<1.2.3-beta.9', false],
		['1.2.3-beta.9', '<=1.2.3-beta.9', true],
		['1.2.3', '<=1.2.3-beta.9', false],
		[' v1.2.3-beta.2+build.07 ', '>=1.2.3-beta.1', true],
	];
	for (const [version, range, expected] of cases) {
		assert.equal(satisfies(version, range), expected, `${version} in ${range}`);
	}
});

test('exact and ordered prerelease comparators preserve identifier precedence', () => {
	const cases = [
		['1.2.3-beta.2', '1.2.3-beta.2', true],
		['1.2.3-beta.2+build', '=1.2.3-beta.2', true],
		['1.2.3-beta.3', '=1.2.3-beta.2', false],
		['1.2.3', '=1.2.3-beta.2', false],
		['1.2.3-beta.2', '=1.2.3', false],
		['1.2.3-0', '=1.2.3-0', true],
		['1.2.3-0', '>1.2.3-0', false],
		['1.2.3-1', '>1.2.3-0', true],
		['1.2.3-beta.10', '>1.2.3-beta.2', true],
		['1.2.3-beta.2', '>1.2.3-beta.10', false],
		['1.2.3-beta', '>1.2.3-beta.0', false],
		['1.2.3-beta.0', '>1.2.3-beta', true],
		['1.2.3-beta.0', '<1.2.3-beta.a', true],
		['1.2.3-beta.a', '>1.2.3-beta.999', true],
		['1.2.3-Beta', '<1.2.3-alpha', true],
	];
	for (const [version, range, expected] of cases) {
		assert.equal(satisfies(version, range), expected, `${version} in ${range}`);
	}
});

test('caret and tilde prerelease ranges retain their lower bound and core restriction', () => {
	for (const operator of ['^', '~']) {
		for (const core of ['1.2.3', '0.2.3', '0.0.3', '0.0.0']) {
			const range = `${operator}${core}-beta.2`;
			for (const [suffix, expected] of [['-alpha', false], ['-beta.1', false], ['-beta.2', true], ['-beta.11', true], ['-rc.1', true], ['', true]]) {
				assert.equal(satisfies(core + suffix, range), expected, `${core + suffix} in ${range}`);
			}
		}
		assert.equal(satisfies('1.2.4-beta.3', `${operator}1.2.3-beta.2`), false);
		assert.equal(satisfies('1.2.4', `${operator}1.2.3-beta.2`), true);
		assert.equal(satisfies('0.0.1-alpha', `${operator}0.0.0-beta.2`), false);
	}
});

test('prerelease eligibility requires one matching bound and all comparisons in that set', () => {
	const cases = [
		['1.2.3-beta.2', '>=1.2.3-beta.1 <1.2.3', true],
		['1.2.3-beta.2', '<1.2.3 >=1.2.3-beta.1', true],
		['1.2.3-beta.2', '>=1.0.0 <=1.2.3-beta.9', true],
		['1.2.3-beta.2', '>=1.2.3-beta.1 <1.2.3-beta.2', false],
		['1.2.3-beta.2', '>=1.2.3-beta.3 <1.2.3', false],
		['1.2.3-beta.2', '>=1.2.3-beta.1 >=1.2.3', false],
		['1.2.3-beta.2', '<1.0.0 >=1.2.3-beta.1', false],
		['1.2.3-beta.2', '>=1.2.3-beta.1 <1.3.0-alpha', true],
		['1.3.0-beta', '>=1.2.3-alpha <1.3.0-rc', true],
		['1.2.4-beta', '>=1.2.3-alpha <1.3.0-rc', false],
	];
	for (const [version, range, expected] of cases) {
		assert.equal(satisfies(version, range), expected, `${version} in ${range}`);
	}
});

test('prerelease permission stays within its own OR set', () => {
	const version = '1.2.3-beta.2';
	const cases = [
		['>=1.0.0 <2.0.0 || >=1.2.3-beta.3 <1.2.3', false],
		['>=1.2.3-beta.3 <1.2.3 || >=1.0.0 <2.0.0', false],
		['* || >1.2.3-beta.3', false],
		['>1.2.3-beta.3 || *', false],
		[' || >1.2.3-beta.3', false],
		['>1.2.3-beta.3 || ', false],
		['>=1.0.0 <1.1.0 || >=1.2.3-beta.1 <1.2.3', true],
		['>=1.2.3-beta.1 <1.2.3 || >=1.0.0 <1.1.0', true],
		['* || >=1.2.3-beta.1', true],
	];
	for (const [range, expected] of cases) {
		assert.equal(satisfies(version, range), expected, range);
	}
});

test('expanded range boundaries still use version precedence when another comparator admits prereleases', () => {
	// The README expands these upper bounds to stable versions. A prerelease
	// of that upper version is lower, and an explicit comparator can admit it.
	const cases = [
		['2.0.0-alpha', '^1.2.3 >=2.0.0-0', true],
		['2.0.0', '^1.2.3 >=2.0.0-0', false],
		['1.3.0-alpha', '~1.2.3 >=1.3.0-0', true],
		['1.3.0', '~1.2.3 >=1.3.0-0', false],
		['0.3.0-alpha', '^0.2.3 >=0.3.0-0', true],
		['0.0.4-alpha', '^0.0.3 >=0.0.4-0', true],
		['2.0.0-alpha', '1.x >=2.0.0-0', true],
		['1.3.0-alpha', '1.2.x >=1.3.0-0', true],
		['1.3.0-alpha', '<=1.2 >=1.3.0-0', true],
		['1.3.0-alpha', '>1.2 >=1.3.0-0', false],
		['1.2.0-alpha', '<1.2 >=1.2.0-0', true],
		['1.2.0-alpha', '>=1.2 >=1.2.0-0', false],
		['1.2.0-alpha', '1.2 >=1.2.0-0', false],
		['1.2.3-beta', '* >=1.2.3-alpha', true],
	];
	for (const [version, range, expected] of cases) {
		assert.equal(satisfies(version, range), expected, `${version} in ${range}`);
	}
});
