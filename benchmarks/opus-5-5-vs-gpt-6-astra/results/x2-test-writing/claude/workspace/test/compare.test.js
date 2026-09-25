import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compare } from './support/semver.js';

// Checks every pair of versions in a list that should be in strictly increasing order.
function assertAscending(versions) {
	for (const [i, a] of versions.entries()) {
		for (const [j, b] of versions.entries()) {
			const expected = i < j ? -1 : i > j ? 1 : 0;
			assert.equal(compare(a, b), expected, `compare(${JSON.stringify(a)}, ${JSON.stringify(b)})`);
		}
	}
}

function assertEquivalent(a, b) {
	assert.equal(compare(a, b), 0, `compare(${JSON.stringify(a)}, ${JSON.stringify(b)})`);
	assert.equal(compare(b, a), 0, `compare(${JSON.stringify(b)}, ${JSON.stringify(a)})`);
}

describe('compare', () => {
	describe('result', () => {
		it('is -1, 0 or 1 as a is lower than, equal to or higher than b', () => {
			assert.equal(compare('1.2.3', '1.2.4'), -1);
			assert.equal(compare('1.2.4', '1.2.3'), 1);
			assert.equal(compare('1.2.3', '1.2.3'), 0);
		});

		it('is exactly -1 or 1 however far apart the versions are', () => {
			assert.equal(compare('1.0.0', '5.0.0'), -1);
			assert.equal(compare('5.0.0', '1.0.0'), 1);
			assert.equal(compare('1.1.0', '1.9.0'), -1);
			assert.equal(compare('1.9.0', '1.1.0'), 1);
			assert.equal(compare('1.1.1', '1.1.9'), -1);
			assert.equal(compare('1.1.9', '1.1.1'), 1);
			assert.equal(compare('1.0.0-1', '1.0.0-9'), -1);
			assert.equal(compare('1.0.0-9', '1.0.0-1'), 1);
			assert.equal(compare('1.0.0-a', '1.0.0-z'), -1);
			assert.equal(compare('1.0.0-z', '1.0.0-a'), 1);
			assert.equal(compare('1.0.0-a', '1.0.0-a.b.c.d'), -1);
			assert.equal(compare('1.0.0-a.b.c.d', '1.0.0-a'), 1);
		});
	});

	describe('major, minor and patch', () => {
		it('compares major, then minor, then patch', () => {
			assertAscending([
				'0.0.0',
				'0.0.1',
				'0.0.9',
				'0.1.0',
				'0.1.9',
				'0.9.0',
				'1.0.0',
				'1.0.1',
				'1.0.99',
				'1.1.0',
				'1.1.1',
				'1.99.99',
				'2.0.0',
				'3.2.1'
			]);
		});

		it('compares them as numbers, not strings', () => {
			assertAscending(['0.0.2', '0.0.10', '0.2.0', '0.10.0', '2.0.0', '10.0.0', '10.0.2', '10.0.10', '100.0.0']);
		});
	});

	describe('pre-release versus release', () => {
		it('puts 1.0.0-alpha below 1.0.0', () => {
			assert.equal(compare('1.0.0-alpha', '1.0.0'), -1);
			assert.equal(compare('1.0.0', '1.0.0-alpha'), 1);
		});

		it('puts any pre-release below the same version without one', () => {
			assert.equal(compare('1.2.3-0', '1.2.3'), -1);
			assert.equal(compare('1.2.3', '1.2.3-0'), 1);
			assert.equal(compare('1.2.3-zzz.999', '1.2.3'), -1);
			assert.equal(compare('1.2.3', '1.2.3-zzz.999'), 1);
		});

		it('only looks at pre-releases when major, minor and patch are equal', () => {
			assertAscending([
				'0.9.9',
				'1.0.0-alpha',
				'1.0.0',
				'1.0.1-0',
				'1.0.1-alpha',
				'1.0.1',
				'1.1.0-0',
				'1.1.0',
				'2.0.0-rc.1',
				'2.0.0'
			]);
		});
	});

	describe('pre-releases', () => {
		it('orders the README example', () => {
			assertAscending([
				'1.0.0-alpha',
				'1.0.0-alpha.1',
				'1.0.0-alpha.beta',
				'1.0.0-beta',
				'1.0.0-beta.2',
				'1.0.0-beta.11',
				'1.0.0-rc.1',
				'1.0.0'
			]);
		});

		it('compares numeric identifiers as numbers', () => {
			assertAscending(['1.0.0-0', '1.0.0-1', '1.0.0-2', '1.0.0-10', '1.0.0-11', '1.0.0-100']);
			assertAscending(['1.0.0-rc.2', '1.0.0-rc.10', '1.0.0-rc.10.2', '1.0.0-rc.10.10']);
			assertEquivalent('1.0.0-7', '1.0.0-7');
			assertEquivalent('1.0.0-beta.10', '1.0.0-beta.10');
		});

		it('compares alphanumeric identifiers as strings, in ASCII order', () => {
			assertAscending(['1.0.0--', '1.0.0-0a', '1.0.0-A', '1.0.0-B', '1.0.0-Z', '1.0.0-a', '1.0.0-b', '1.0.0-z']);
			assertAscending(['1.0.0-alpha', '1.0.0-alphabet', '1.0.0-alphz', '1.0.0-beta', '1.0.0-rc']);
			assertAscending(['1.0.0-RC', '1.0.0-Rc', '1.0.0-rC', '1.0.0-rc']);
			// Digits inside an alphanumeric identifier are just characters: '10a' < '1a' < '9a'.
			assertAscending(['1.0.0-10a', '1.0.0-1a', '1.0.0-9a']);
			assertAscending(['1.0.0-a-b', '1.0.0-a1', '1.0.0-aa']);
			assertEquivalent('1.0.0-alpha', '1.0.0-alpha');
			assertEquivalent('1.0.0-x-y-z.--', '1.0.0-x-y-z.--');
		});

		it('puts numeric identifiers below alphanumeric ones', () => {
			assert.equal(compare('1.0.0-1', '1.0.0-a'), -1);
			assert.equal(compare('1.0.0-a', '1.0.0-1'), 1);
			assert.equal(compare('1.0.0-999', '1.0.0-A'), -1);
			assert.equal(compare('1.0.0-A', '1.0.0-999'), 1);
			assert.equal(compare('1.0.0-beta.99', '1.0.0-beta.rc'), -1);
			assert.equal(compare('1.0.0-beta.rc', '1.0.0-beta.99'), 1);
		});

		it('puts numeric identifiers below alphanumeric ones that look like numbers', () => {
			// '-1', '0x1' and '1e1' are alphanumeric, although JavaScript reads them as -1, 1 and 10.
			assertAscending(['1.0.0-0', '1.0.0-2', '1.0.0-20', '1.0.0--1', '1.0.0-0x1', '1.0.0-1e1', '1.0.0-a']);
		});

		it('puts the shorter list lower when all its identifiers are equal', () => {
			assertAscending(['1.0.0-a', '1.0.0-a.b', '1.0.0-a.b.c', '1.0.0-a.b.c.0']);
			assertAscending(['1.0.0-1', '1.0.0-1.0', '1.0.0-1.0.0']);
			assertAscending(['1.0.0-rc', '1.0.0-rc.1', '1.0.0-rc.1.1']);
		});

		it('is decided by the first identifier that differs', () => {
			assertAscending(['1.0.0-alpha.9', '1.0.0-beta.1']);
			assertAscending(['1.0.0-1.z', '1.0.0-2.a']);
			assertAscending(['1.0.0-a.1.z', '1.0.0-a.2.a']);
			assertAscending(['1.0.0-a.b.9', '1.0.0-a.c.1']);
			assertAscending(['1.0.0-a.b.c.d.e.1', '1.0.0-a.b.c.d.e.2']);
		});

		it('returns 0 for equal lists of identifiers', () => {
			assertEquivalent('1.0.0-alpha.1', '1.0.0-alpha.1');
			assertEquivalent('1.0.0-0.3.7', '1.0.0-0.3.7');
			assertEquivalent('1.0.0-x.7.z.92', '1.0.0-x.7.z.92');
		});
	});

	describe('build metadata', () => {
		it('treats 1.0.0+a and 1.0.0+b as equal', () => {
			assertEquivalent('1.0.0+a', '1.0.0+b');
		});

		it('is ignored', () => {
			assertEquivalent('1.0.0+build.1', '1.0.0');
			assertEquivalent('1.0.0-rc.1+x', '1.0.0-rc.1+y.2');
			assertEquivalent('1.0.0-rc.1+x', '1.0.0-rc.1');
			assert.equal(compare('1.0.0+zzz', '1.0.1+aaa'), -1);
			assert.equal(compare('1.0.1+aaa', '1.0.0+zzz'), 1);
			assert.equal(compare('1.0.0-alpha+999', '1.0.0-alpha.1'), -1);
			assert.equal(compare('1.0.0-alpha.1', '1.0.0-alpha+999'), 1);
			assert.equal(compare('1.0.0-rc.1+build', '1.0.0'), -1);
		});
	});

	describe('input', () => {
		it('accepts the same text as parse(), with whitespace and a leading v', () => {
			assertEquivalent(' v1.2.3 ', '1.2.3');
			assertEquivalent('v1.2.3-beta.1', '1.2.3-beta.1+exp');
			assert.equal(compare('v2.0.0', '10.0.0'), -1);
			assert.equal(compare('10.0.0', 'v2.0.0'), 1);
		});

		it('throws a TypeError if either version is invalid', () => {
			const invalid = ['nope', '', '1.2', '1.2.3.4', '01.2.3', '1.0.0-01', 'x.y.z', null, undefined, 123, {}];
			for (const bad of invalid) {
				const shown = String(bad);
				assert.throws(() => compare(bad, '1.2.3'), TypeError, `compare(${shown}, '1.2.3')`);
				assert.throws(() => compare('1.2.3', bad), TypeError, `compare('1.2.3', ${shown})`);
				assert.throws(() => compare(bad, bad), TypeError, `compare(${shown}, ${shown})`);
			}
		});

		// Not in the README, but an error that names the wrong argument isn't much help.
		it('names the invalid version in the error', () => {
			assert.throws(() => compare('nope', '1.2.3'), { name: 'TypeError', message: /nope/ });
			assert.throws(() => compare('1.2.3', 'nope'), { name: 'TypeError', message: /nope/ });
			assert.throws(() => compare('1.2.3', '01.2.3'), { name: 'TypeError', message: /01\.2\.3/ });
			assert.throws(() => compare('bad', 'worse'), { name: 'TypeError', message: /bad/ });
		});
	});
});
