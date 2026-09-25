import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { maxSatisfying } from './support/semver.js';

describe('maxSatisfying', () => {
	it('returns the highest version in the list that satisfies the range', () => {
		assert.equal(maxSatisfying(['1.2.3', '1.2.4', '1.3.0', '2.0.0'], '~1.2.0'), '1.2.4');
		assert.equal(maxSatisfying(['0.9.0', '1.0.0', '1.5.0', '1.2.0', '2.0.0'], '1.x'), '1.5.0');
		assert.equal(maxSatisfying(['1.0.0', '2.0.0', '1.10.0', '1.9.0'], '^1.0.0'), '1.10.0');
	});

	it('finds the highest version wherever it is in the list', () => {
		assert.equal(maxSatisfying(['1.5.0', '1.0.0', '1.2.0'], '*'), '1.5.0');
		assert.equal(maxSatisfying(['1.0.0', '1.5.0', '1.2.0'], '*'), '1.5.0');
		assert.equal(maxSatisfying(['1.0.0', '1.2.0', '1.5.0'], '*'), '1.5.0');
		assert.equal(maxSatisfying(['1.2.0', '1.0.0', '1.5.0', '1.1.0'], '*'), '1.5.0');
	});

	it('returns a single satisfying version', () => {
		assert.equal(maxSatisfying(['1.2.3'], '1.2.3'), '1.2.3');
		assert.equal(maxSatisfying(['0.1.0', '1.2.3', '3.0.0'], '1.2.3'), '1.2.3');
	});

	it('returns null if no version satisfies the range', () => {
		assert.equal(maxSatisfying(['1.0.0', '2.0.0'], '3.x'), null);
		assert.equal(maxSatisfying(['1.0.0-beta', '1.0.1-rc.1'], '*'), null);
	});

	it('returns null for an empty list', () => {
		assert.equal(maxSatisfying([], '*'), null);
	});

	it('returns the string as given', () => {
		assert.equal(maxSatisfying(['1.0.0', ' v1.5.0 ', '1.2.0'], '1.x'), ' v1.5.0 ');
		assert.equal(maxSatisfying(['1.5.0+build.7', '1.2.0'], '1.x'), '1.5.0+build.7');
		assert.equal(maxSatisfying(['v2.0.0-rc.1', '2.0.0-beta'], '>=2.0.0-beta'), 'v2.0.0-rc.1');
	});

	// The README doesn't say which of several equal versions is returned; this pins down the current
	// behaviour.
	it('keeps the first of several equal versions', () => {
		assert.equal(maxSatisfying(['1.2.3+a', 'v1.2.3', '1.2.3', '1.2.3+b'], '*'), '1.2.3+a');
		assert.equal(maxSatisfying(['1.0.0', '1.2.3+b', '1.2.3+a'], '*'), '1.2.3+b');
	});

	it('skips invalid versions', () => {
		const versions = ['nope', '1.0.0', '1.2', '3.0.0.0', '01.5.0', null, 42, '1.1.0', '1.9', undefined];
		assert.equal(maxSatisfying(versions, '*'), '1.1.0');
		assert.equal(maxSatisfying(['nope', '1.2', '9.9.9.9', null], '*'), null);
		assert.equal(maxSatisfying(['nope', '1.0.0'], '*'), '1.0.0');
		assert.equal(maxSatisfying(['1.0.0', 'nope'], '*'), '1.0.0');
	});

	it('orders pre-releases like compare()', () => {
		const betas = ['1.2.3-beta.2', '1.2.3-beta.11', '1.2.3-beta.3', '1.2.3-alpha.99'];
		assert.equal(maxSatisfying(betas, '>=1.2.3-alpha.1'), '1.2.3-beta.11');
		assert.equal(maxSatisfying(['1.2.3-rc.1', '1.2.3', '1.2.3-beta'], '>=1.2.3-beta'), '1.2.3');
		assert.equal(maxSatisfying(['1.2.3', '1.2.4-beta.1', '1.2.4-0'], '>=1.2.3-beta'), '1.2.3');
		assert.equal(maxSatisfying(['1.2.3', '1.3.0-0'], '^1.2.3'), '1.2.3');
	});

	it('throws a TypeError for an invalid range, like satisfies()', () => {
		assert.throws(() => maxSatisfying(['1.2.3'], 'nope'), TypeError);
		assert.throws(() => maxSatisfying(['1.2.3', '2.0.0'], '>=1.0.0 <nope'), TypeError);
	});
});
