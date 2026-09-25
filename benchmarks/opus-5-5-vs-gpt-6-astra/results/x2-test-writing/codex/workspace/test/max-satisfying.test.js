import test from 'node:test';
import assert from 'node:assert/strict';
import { maxSatisfying } from '../src/semver.js';

test('maxSatisfying returns null when there is no eligible version', () => {
	assert.equal(maxSatisfying([], '*'), null);
	assert.equal(maxSatisfying(['invalid', '1.2', '01.2.3', null, undefined, 123], '*'), null);
	assert.equal(maxSatisfying(['1.0.0', '2.0.0', '3.0.0'], '>=4.0.0'), null);
	assert.equal(maxSatisfying(['1.0.0-alpha', '2.0.0-beta.1'], '*'), null);
	assert.equal(maxSatisfying(['1.2.3'], '>1.2.3 <1.2.4'), null);
});

test('maxSatisfying accepts a single matching version and skips invalid entries', () => {
	assert.equal(maxSatisfying(['0.0.0'], '*'), '0.0.0');
	assert.equal(maxSatisfying(['1.2.3'], '1.2.3'), '1.2.3');
	const invalid = ['999.0', '999.0.0-01', '999.0.0+', '', null, undefined, 999, {}, []];
	assert.equal(maxSatisfying([...invalid, '1.2.3'], '*'), '1.2.3');
	assert.equal(maxSatisfying(['1.2.3', ...invalid], '*'), '1.2.3');
	assert.equal(maxSatisfying(['1.2.3', ...invalid, '1.2.4', ...invalid], '*'), '1.2.4');
});

test('maxSatisfying chooses the numeric maximum regardless of input order', () => {
	const cases = [
		{ versions: ['0.0.0', '2.99.99', '10.0.0', '9.99.99'], expected: '10.0.0' },
		{ versions: ['1.0.99', '1.2.99', '1.10.0', '1.9.99'], expected: '1.10.0' },
		{ versions: ['1.2.0', '1.2.2', '1.2.10', '1.2.9'], expected: '1.2.10' }
	];
	for (const { versions, expected } of cases) {
		for (const order of [versions, [...versions].reverse(), [expected, ...versions.filter((v) => v !== expected)]]) {
			assert.equal(maxSatisfying(order, '*'), expected, JSON.stringify(order));
		}
	}
});

test('maxSatisfying returns the selected string exactly as supplied', () => {
	const selected = ' \tv1.10.0+release.0001 \n';
	assert.equal(maxSatisfying(['1.9.9+zzz', selected, '1.2.3'], '^1.0.0'), selected);
	assert.equal(maxSatisfying(['1.2.3+z', '1.2.4+a'], '*'), '1.2.4+a');
	const prerelease = ' v1.2.3-beta.10+build.7 ';
	assert.equal(maxSatisfying(['1.2.3-beta.2', prerelease], '>=1.2.3-beta.1 <1.2.3'), prerelease);
});

test('maxSatisfying filters by the range before selecting its maximum', () => {
	const versions = ['3.0.0', '1.2.3', '2.1.0', '1.2.9', '0.2.9', '1.3.0', '2.0.0', '0.3.0', '0.0.3', '0.0.4'];
	const cases = [
		['1.2.3', '1.2.3'],
		['=1.2.3', '1.2.3'],
		['<1.2.9', '1.2.3'],
		['<=1.2.9', '1.2.9'],
		['>2.0.0 <3.0.0', '2.1.0'],
		['>=2.0.0 <2.1.0', '2.0.0'],
		['^1.2.3', '1.3.0'],
		['^0.2.3', '0.2.9'],
		['^0.0.3', '0.0.3'],
		['~1.2.3', '1.2.9'],
		['1', '1.3.0'],
		['1.x', '1.3.0'],
		['1.*', '1.3.0'],
		['1.2', '1.2.9'],
		['1.2.x', '1.2.9'],
		['>1.2 <2.0.0', '1.3.0'],
		['<=1.2', '1.2.9'],
		['<1.2', '0.3.0'],
		['>=1.2 <1.3.0', '1.2.9'],
		['1.2.3 || 2.0.0', '2.0.0'],
		['2.0.0 || 1.2.3', '2.0.0'],
		['>=9.0.0 || ~1.2.3', '1.2.9'],
		['', '3.0.0'],
		['x', '3.0.0']
	];
	for (const [range, expected] of cases) {
		assert.equal(maxSatisfying(versions, range), expected, range);
		assert.equal(maxSatisfying([...versions].reverse(), range), expected, `${range}, reversed`);
	}
});

test('maxSatisfying excludes prereleases unless a matching set permits their core version', () => {
	assert.equal(maxSatisfying(['1.2.3', '2.0.0-alpha'], '*'), '1.2.3');
	assert.equal(maxSatisfying(['1.2.3-beta.2', '1.2.4-beta.1'], '>=1.2.3-beta.1'), '1.2.3-beta.2');
	assert.equal(maxSatisfying(['1.2.3-beta.2', '1.2.4'], '>=1.2.3-beta.1'), '1.2.4');
	assert.equal(maxSatisfying(['1.2.3-beta.2', '1.2.3'], '>=1.2.3-beta.1'), '1.2.3');
	assert.equal(maxSatisfying(['1.2.3-beta.2'], '>=1.2.3-beta.1 <1.2.3-beta.2'), null);
	assert.equal(maxSatisfying(['1.2.3-beta.2'], '>2.0.0 || <1.2.3'), null);
	assert.equal(maxSatisfying(['1.2.3-beta.2'], '>1.2.3-beta.9 || <1.2.3'), null);
	assert.equal(maxSatisfying(['1.2.3-beta.2', '2.0.0-beta.2'], '>=1.2.3-beta.1 || >=2.0.0-beta.1'), '2.0.0-beta.2');
});

test('maxSatisfying orders eligible prereleases by identifiers', () => {
	const cases = [
		[['1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-beta.9'], '1.0.0-beta.11'],
		[['1.0.0-99', '1.0.0-alpha', '1.0.0-100'], '1.0.0-alpha'],
		[['1.0.0-alpha.1', '1.0.0-alpha', '1.0.0-alpha.1.0'], '1.0.0-alpha.1.0'],
		[['1.0.0-Beta', '1.0.0-alpha', '1.0.0-Zeta'], '1.0.0-alpha'],
		[['1.0.0-rc.1', '1.0.0-beta.99', '1.0.0-alpha'], '1.0.0-rc.1']
	];
	for (const [versions, expected] of cases) {
		assert.equal(maxSatisfying(versions, '>=1.0.0-0 <1.0.0'), expected);
		assert.equal(maxSatisfying([...versions].reverse(), '>=1.0.0-0 <1.0.0'), expected);
	}
});
