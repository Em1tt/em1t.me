// Reference tests for X2: they show every mutant can be caught.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, compare, satisfies, maxSatisfying } from '../src/semver.js';

test('parse: valid versions', () => {
	assert.deepEqual(parse('1.2.3'), { major: 1, minor: 2, patch: 3, prerelease: [] });
	assert.deepEqual(parse(' v1.2.3 '), { major: 1, minor: 2, patch: 3, prerelease: [] });
	assert.deepEqual(parse('1.2.3-beta.10'), { major: 1, minor: 2, patch: 3, prerelease: ['beta', 10] });
	assert.deepEqual(parse('1.2.3+build.5'), { major: 1, minor: 2, patch: 3, prerelease: [] });
	assert.deepEqual(parse('0.0.0'), { major: 0, minor: 0, patch: 0, prerelease: [] });
});
test('parse: invalid versions', () => {
	for (const bad of ['01.2.3', '1.02.3', '1.2', '1.0.0-01', '1.2.3-', 'x.2.3', '', null, 5]) assert.equal(parse(bad), null, String(bad));
});
test('compare: order', () => {
	const order = ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-alpha.beta', '1.0.0-beta', '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0', '1.0.1', '1.1.0', '2.0.0', '10.0.0'];
	for (let i = 0; i < order.length - 1; i++) {
		assert.equal(compare(order[i], order[i + 1]), -1, `${order[i]} < ${order[i + 1]}`);
		assert.equal(compare(order[i + 1], order[i]), 1);
	}
	assert.equal(compare('1.0.0+a', '1.0.0+b'), 0);
	assert.equal(compare('1.0.0-2', '1.0.0-10'), -1);
	assert.throws(() => compare('1.2', '1.2.3'), TypeError);
});
test('satisfies: comparators', () => {
	assert.equal(satisfies('1.2.3', '1.2.3'), true);
	assert.equal(satisfies('1.2.3', '>=1.2.3'), true);
	assert.equal(satisfies('1.2.3', '>1.2.3'), false);
	assert.equal(satisfies('1.2.3', '<1.2.3'), false);
	assert.equal(satisfies('1.2.2', '<1.2.3'), true);
	assert.equal(satisfies('1.2.3', '<=1.2.3'), true);
});
test('satisfies: caret and tilde', () => {
	assert.equal(satisfies('1.9.9', '^1.2.3'), true);
	assert.equal(satisfies('2.0.0', '^1.2.3'), false);
	assert.equal(satisfies('0.2.9', '^0.2.3'), true);
	assert.equal(satisfies('0.3.0', '^0.2.3'), false);
	assert.equal(satisfies('0.0.3', '^0.0.3'), true);
	assert.equal(satisfies('0.0.4', '^0.0.3'), false);
	assert.equal(satisfies('1.2.9', '~1.2.3'), true);
	assert.equal(satisfies('1.3.0', '~1.2.3'), false);
});
test('satisfies: x-ranges and partials', () => {
	assert.equal(satisfies('1.9.0', '1.x'), true);
	assert.equal(satisfies('2.0.0', '1.x'), false);
	assert.equal(satisfies('1.2.9', '1.2.x'), true);
	assert.equal(satisfies('1.3.0', '1.2.x'), false);
	assert.equal(satisfies('1.3.0', '>1.2'), true);
	assert.equal(satisfies('1.2.9', '>1.2'), false);
	assert.equal(satisfies('5.0.0', '*'), true);
});
test('satisfies: sets', () => {
	assert.equal(satisfies('3.0.0', '>=1.0.0 <2.0.0'), false);
	assert.equal(satisfies('1.5.0', '>=1.0.0 <2.0.0'), true);
	assert.equal(satisfies('3.1.0', '1.x || >=3.0.0'), true);
	assert.equal(satisfies('2.1.0', '1.x || >=3.0.0'), false);
});
test('satisfies: pre-releases', () => {
	assert.equal(satisfies('1.2.3-beta.2', '>=1.2.3-beta.1'), true);
	assert.equal(satisfies('1.2.4-beta.1', '>=1.2.3-beta.1'), false);
	assert.equal(satisfies('1.0.0-beta', '*'), false);
	assert.equal(satisfies('nope', '*'), false);
});
test('maxSatisfying', () => {
	assert.equal(maxSatisfying(['1.2.3', '1.9.0', 'bad', '2.0.0', '1.4.0'], '^1.2.0'), '1.9.0');
	assert.equal(maxSatisfying(['3.0.0'], '^1.2.0'), null);
});
