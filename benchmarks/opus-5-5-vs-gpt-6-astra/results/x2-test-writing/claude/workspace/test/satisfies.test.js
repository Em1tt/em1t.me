import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { satisfies } from './support/semver.js';

function assertRange(range, { matches = [], rejects = [] }) {
	for (const version of matches) {
		assert.equal(satisfies(version, range), true, `${version} should satisfy ${JSON.stringify(range)}`);
	}
	for (const version of rejects) {
		assert.equal(satisfies(version, range), false, `${version} should not satisfy ${JSON.stringify(range)}`);
	}
}

describe('satisfies', () => {
	describe('exact versions: 1.2.3 or =1.2.3', () => {
		for (const range of ['1.2.3', '=1.2.3']) {
			it(`${range} is exactly 1.2.3`, () => {
				assertRange(range, {
					matches: ['1.2.3', 'v1.2.3', ' 1.2.3 ', '1.2.3+build.7'],
					rejects: ['1.2.2', '1.2.4', '1.1.3', '1.3.3', '0.2.3', '2.2.3', '1.2.30', '0.0.0']
				});
			});
		}

		it('accepts any valid version number', () => {
			for (const version of ['0.0.0', '1.10.100', '9.99.999', '123.4567.89012']) {
				assertRange(version, { matches: [version] });
				assertRange(`=${version}`, { matches: [version] });
			}
			assertRange('0.0.0', { rejects: ['0.0.1', '0.1.0', '1.0.0'] });
			assertRange('9.99.999', { rejects: ['9.99.998', '9.98.999', '8.99.999'] });
		});

		it('allows a leading v in the range, as in versions', () => {
			assertRange('v1.2.3', { matches: ['1.2.3'], rejects: ['1.2.4'] });
			assertRange('=v1.2.3', { matches: ['1.2.3'], rejects: ['1.2.2'] });
			assertRange('>=v1.2.0', { matches: ['1.2.0', '1.3.0'], rejects: ['1.1.9'] });
		});
	});

	describe('comparison operators', () => {
		it('>1.2.3 is greater than 1.2.3', () => {
			assertRange('>1.2.3', {
				matches: ['1.2.4', '1.3.0', '2.0.0', '10.0.0'],
				rejects: ['1.2.3', '1.2.3+build', '1.2.2', '1.1.9', '0.9.9', '0.0.0']
			});
		});

		it('>=1.2.3 is greater than or equal to 1.2.3', () => {
			assertRange('>=1.2.3', {
				matches: ['1.2.3', '1.2.4', '1.3.0', '2.0.0'],
				rejects: ['1.2.2', '1.1.9', '0.0.0']
			});
		});

		it('<1.2.3 is less than 1.2.3', () => {
			assertRange('<1.2.3', {
				matches: ['1.2.2', '1.1.9', '0.9.9', '0.0.0'],
				rejects: ['1.2.3', '1.2.3+build', '1.2.4', '1.3.0', '2.0.0']
			});
		});

		it('<=1.2.3 is less than or equal to 1.2.3', () => {
			assertRange('<=1.2.3', {
				matches: ['1.2.3', '1.2.2', '1.1.9', '0.0.0'],
				rejects: ['1.2.4', '1.3.0', '2.0.0']
			});
		});
	});

	describe('caret ranges', () => {
		it('^1.2.3 is >=1.2.3 <2.0.0', () => {
			assertRange('^1.2.3', {
				matches: ['1.2.3', '1.2.4', '1.3.0', '1.99.99'],
				rejects: ['1.2.2', '1.0.0', '0.2.3', '2.0.0', '2.0.1', '3.0.0']
			});
		});

		it('^0.2.3 is >=0.2.3 <0.3.0', () => {
			assertRange('^0.2.3', {
				matches: ['0.2.3', '0.2.4', '0.2.99'],
				rejects: ['0.2.2', '0.0.3', '0.3.0', '0.3.1', '1.0.0']
			});
		});

		it('^0.0.3 is >=0.0.3 <0.0.4', () => {
			assertRange('^0.0.3', {
				matches: ['0.0.3'],
				rejects: ['0.0.2', '0.0.4', '0.0.5', '0.1.0', '1.0.0']
			});
		});

		it('keeps the left-most non-zero part for other versions too', () => {
			assertRange('^1.0.0', { matches: ['1.0.0', '1.99.99'], rejects: ['0.99.99', '2.0.0'] });
			assertRange('^10.20.30', { matches: ['10.20.30', '10.99.0'], rejects: ['10.20.29', '11.0.0'] });
			assertRange('^0.1.0', { matches: ['0.1.0', '0.1.99'], rejects: ['0.0.99', '0.2.0'] });
			assertRange('^0.10.0', { matches: ['0.10.0', '0.10.99'], rejects: ['0.11.0', '1.0.0'] });
			assertRange('^0.0.0', { matches: ['0.0.0'], rejects: ['0.0.1', '0.1.0'] });
			assertRange('^0.0.10', { matches: ['0.0.10'], rejects: ['0.0.9', '0.0.11'] });
		});
	});

	describe('tilde ranges', () => {
		it('~1.2.3 is >=1.2.3 <1.3.0', () => {
			assertRange('~1.2.3', {
				matches: ['1.2.3', '1.2.4', '1.2.99'],
				rejects: ['1.2.2', '1.1.9', '1.3.0', '1.3.1', '2.0.0', '2.2.3']
			});
		});

		it('allows patch-level changes even when major or minor is 0', () => {
			assertRange('~0.2.3', { matches: ['0.2.3', '0.2.9'], rejects: ['0.2.2', '0.3.0'] });
			assertRange('~0.0.3', { matches: ['0.0.3', '0.0.4', '0.0.99'], rejects: ['0.0.2', '0.1.0'] });
			assertRange('~10.20.30', { matches: ['10.20.30', '10.20.99'], rejects: ['10.20.29', '10.21.0'] });
		});
	});

	describe('x-ranges and partial versions', () => {
		for (const range of ['1.x', '1.X', '1.*', '1', '1.x.x', '1.*.*']) {
			it(`${range} is >=1.0.0 <2.0.0`, () => {
				assertRange(range, {
					matches: ['1.0.0', '1.2.3', '1.99.99'],
					rejects: ['0.0.0', '0.99.99', '2.0.0', '2.0.1', '10.0.0']
				});
			});
		}

		for (const range of ['1.2.x', '1.2.X', '1.2.*', '1.2']) {
			it(`${range} is >=1.2.0 <1.3.0`, () => {
				assertRange(range, {
					matches: ['1.2.0', '1.2.9', '1.2.99'],
					rejects: ['1.1.99', '1.3.0', '1.3.1', '0.2.0', '2.2.0']
				});
			});
		}

		for (const range of ['*', 'x', 'X', '', ' ', 'x.x.x', '*.*.*']) {
			it(`${JSON.stringify(range)} is any version`, () => {
				assertRange(range, { matches: ['0.0.0', '0.0.1', '1.2.3', '99.99.99'] });
			});
		}

		// The README doesn't mention a number after an x; the implementation ignores it.
		it('treats the parts after an x or * as any too: 1.x.3 is 1.x', () => {
			const oneX = { matches: ['1.0.0', '1.2.3', '1.5.0', '1.99.99'], rejects: ['0.99.99', '2.0.0'] };
			assertRange('1.x.3', oneX);
			assertRange('1.*.0', oneX);
			assertRange('x.2.3', { matches: ['0.0.0', '1.0.0', '5.0.0'] });
		});

		it('works with 0 and multi-digit parts', () => {
			assertRange('0.x', { matches: ['0.0.0', '0.99.99'], rejects: ['1.0.0'] });
			assertRange('0.0.x', { matches: ['0.0.0', '0.0.9'], rejects: ['0.1.0', '1.0.0'] });
			assertRange('10.x', { matches: ['10.0.0', '10.5.5'], rejects: ['1.0.0', '9.9.9', '11.0.0'] });
			assertRange('1.10', { matches: ['1.10.0', '1.10.9'], rejects: ['1.1.0', '1.9.9', '1.11.0'] });
		});
	});

	describe('a partial version after an operator covers its whole span', () => {
		it('>1.2 means >=1.3.0', () => {
			assertRange('>1.2', { matches: ['1.3.0', '1.3.1', '2.0.0'], rejects: ['1.2.0', '1.2.99', '1.0.0'] });
		});

		it('<1.2 means <1.2.0', () => {
			assertRange('<1.2', { matches: ['1.1.99', '1.0.0', '0.0.0'], rejects: ['1.2.0', '1.2.5', '1.3.0'] });
		});

		it('<=1.2 means <1.3.0', () => {
			assertRange('<=1.2', {
				matches: ['1.2.0', '1.2.99', '1.1.0', '0.0.0'],
				rejects: ['1.3.0', '1.3.1', '2.0.0']
			});
		});

		it('>=1.2 means >=1.2.0', () => {
			assertRange('>=1.2', { matches: ['1.2.0', '1.2.5', '1.3.0', '2.0.0'], rejects: ['1.1.99', '0.0.0'] });
		});

		it('=1.2 means >=1.2.0 <1.3.0', () => {
			assertRange('=1.2', { matches: ['1.2.0', '1.2.99'], rejects: ['1.1.99', '1.3.0'] });
		});

		it('works the same with only a major version', () => {
			assertRange('>1', { matches: ['2.0.0', '3.0.0'], rejects: ['1.0.0', '1.99.99'] });
			assertRange('<1', { matches: ['0.0.0', '0.99.99'], rejects: ['1.0.0', '1.2.3'] });
			assertRange('<=1', { matches: ['0.0.0', '1.0.0', '1.99.99'], rejects: ['2.0.0', '2.0.1'] });
			assertRange('>=1', { matches: ['1.0.0', '5.0.0'], rejects: ['0.99.99', '0.0.0'] });
			assertRange('=1', { matches: ['1.0.0', '1.99.99'], rejects: ['0.99.99', '2.0.0'] });
		});

		it('works the same with x or *', () => {
			assertRange('>1.x', { matches: ['2.0.0'], rejects: ['1.99.99'] });
			assertRange('<1.*', { matches: ['0.99.99'], rejects: ['1.0.0'] });
			assertRange('<=1.2.x', { matches: ['1.2.99'], rejects: ['1.3.0'] });
			assertRange('>=1.2.*', { matches: ['1.2.0'], rejects: ['1.1.99'] });
			assertRange('>0.0.x', { matches: ['0.1.0'], rejects: ['0.0.99'] });
		});

		it('matches nothing for >* and <*, and anything for >=* and <=*', () => {
			const all = ['0.0.0', '0.0.1', '1.2.3', '99.99.99'];
			for (const range of ['>*', '<*', '>x', '<x']) assertRange(range, { rejects: all });
			for (const range of ['>=*', '<=*', '=*', '>=x', '<=X']) assertRange(range, { matches: all });
		});
	});

	describe('sets of comparators', () => {
		it('needs every comparator in a set to match', () => {
			assertRange('>=1.2.3 <1.5.0', {
				matches: ['1.2.3', '1.4.99'],
				rejects: ['1.2.2', '1.5.0', '2.0.0', '0.0.0']
			});
			assertRange('>=1.0.0 <2.0.0 >1.5.0', { matches: ['1.6.0'], rejects: ['1.5.0', '1.2.0', '2.0.0'] });
			assertRange('>1.0.0 <1.0.0', { rejects: ['0.9.9', '1.0.0', '1.0.1'] });
			assertRange('1.x ~1.2.3', { matches: ['1.2.5'], rejects: ['1.3.0', '1.2.2'] });
		});

		it('allows any amount of whitespace around comparators', () => {
			const range = { matches: ['1.2.3', '1.4.0'], rejects: ['1.2.2', '1.5.0'] };
			assertRange('  >=1.2.3    <1.5.0  ', range);
			assertRange('>=1.2.3\t<1.5.0', range);
		});
	});

	describe('|| between sets', () => {
		it('needs one of the sets to match', () => {
			assertRange('1.x || 3.x', {
				matches: ['1.0.0', '1.9.9', '3.0.0', '3.9.9'],
				rejects: ['0.9.9', '2.0.0', '2.5.0', '4.0.0']
			});
			assertRange('1.2.3 || 1.2.5', { matches: ['1.2.3', '1.2.5'], rejects: ['1.2.4'] });
		});

		it('works without spaces around ||', () => {
			assertRange('1.x||3.x', { matches: ['1.5.0', '3.5.0'], rejects: ['2.5.0'] });
		});

		it('combines sets that have several comparators', () => {
			assertRange('<1.0.0 || >=2.0.0 <2.1.0 || 5.x', {
				matches: ['0.5.0', '2.0.0', '2.0.5', '5.5.5'],
				rejects: ['1.0.0', '1.5.0', '2.1.0', '4.0.0', '6.0.0']
			});
			assertRange('>2.0.0 <1.0.0 || 1.5.0', { matches: ['1.5.0'], rejects: ['0.5.0', '2.5.0'] });
		});
	});

	describe('pre-releases', () => {
		it('1.2.3-beta.2 satisfies >=1.2.3-beta.1 but 1.2.4-beta.1 does not', () => {
			assert.equal(satisfies('1.2.3-beta.2', '>=1.2.3-beta.1'), true);
			assert.equal(satisfies('1.2.4-beta.1', '>=1.2.3-beta.1'), false);
		});

		it('no pre-release satisfies *', () => {
			for (const range of ['*', 'x', '', '>=0.0.0']) {
				assertRange(range, { rejects: ['1.2.3-beta', '0.0.0-0', '1.0.0-rc.1'] });
			}
		});

		it('needs a comparator with a pre-release on the same MAJOR.MINOR.PATCH', () => {
			assertRange('>=1.2.3-beta.1', {
				matches: ['1.2.3-beta.1', '1.2.3-beta.2', '1.2.3-beta.10', '1.2.3-rc.1', '1.2.3', '1.2.4', '2.0.0'],
				rejects: [
					'1.2.3-alpha',
					'1.2.3-beta',
					'1.2.3-beta.0',
					'1.2.4-beta.1',
					'1.3.3-beta.1',
					'2.2.3-beta.1',
					'1.2.2',
					'1.2.2-beta.1'
				]
			});
		});

		it('also needs the version to satisfy every comparator in the set', () => {
			assertRange('>=1.2.3-beta.1 <1.2.3-beta.5', {
				matches: ['1.2.3-beta.1', '1.2.3-beta.4'],
				rejects: ['1.2.3-beta.5', '1.2.3-beta.0', '1.2.3-rc.1', '1.2.3']
			});
		});

		it('does not let a pre-release through a range without one', () => {
			assertRange('<=1.2.3', { matches: ['1.2.3'], rejects: ['1.2.3-beta', '1.2.2-beta'] });
			assertRange('<1.2.3', { rejects: ['1.2.3-beta', '1.2.3-0', '1.2.2-beta'] });
			assertRange('>1.2.3', { rejects: ['1.2.4-0', '1.3.0-beta'] });
			assertRange('1.2.3', { rejects: ['1.2.3-beta'] });
			assertRange('^1.2.3', { rejects: ['1.2.3-beta', '1.2.4-0', '1.5.0-beta', '2.0.0-0'] });
			assertRange('~1.2.3', { rejects: ['1.2.4-beta', '1.3.0-0'] });
			assertRange('1.x', { rejects: ['1.0.0-0', '1.5.0-rc.1', '2.0.0-0'] });
			assertRange('<2', { rejects: ['2.0.0-0', '1.5.0-0'] });
			assertRange('<=1.2', { rejects: ['1.3.0-0', '1.2.0-0'] });
			assertRange('>=1.0.0 <2.0.0', { rejects: ['1.5.0-beta', '2.0.0-0'] });
		});

		it('works with a pre-release on an exact version', () => {
			for (const range of ['1.2.3-beta.1', '=1.2.3-beta.1']) {
				assertRange(range, {
					matches: ['1.2.3-beta.1', 'v1.2.3-beta.1+build'],
					rejects: ['1.2.3-beta.2', '1.2.3-beta', '1.2.3-beta.1.0', '1.2.3', '1.2.4-beta.1']
				});
			}
		});

		it('works with a pre-release on < and <=', () => {
			assertRange('<1.2.3-rc', { matches: ['1.2.3-beta', '1.2.2'], rejects: ['1.2.3-rc', '1.2.3', '1.2.2-beta'] });
			assertRange('<=1.2.3-rc', { matches: ['1.2.3-rc', '1.2.3-beta'], rejects: ['1.2.3-rc.1', '1.2.3'] });
			assertRange('>1.2.3-rc', { matches: ['1.2.3-rc.1', '1.2.3'], rejects: ['1.2.3-rc', '1.2.3-beta'] });
		});

		it('works with a pre-release on ^ and ~', () => {
			assertRange('^1.2.3-beta.2', {
				matches: ['1.2.3-beta.2', '1.2.3-beta.4', '1.2.3-rc', '1.2.3', '1.9.0'],
				rejects: ['1.2.3-beta.1', '1.2.3-alpha.9', '1.2.4-beta.2', '1.3.0-beta.2', '2.0.0-0', '2.0.0']
			});
			assertRange('~1.2.3-beta.2', {
				matches: ['1.2.3-beta.2', '1.2.3-beta.4', '1.2.3', '1.2.9'],
				rejects: ['1.2.3-beta.1', '1.2.4-beta.2', '1.3.0-0', '1.3.0']
			});
			assertRange('^0.0.3-beta', {
				matches: ['0.0.3-beta', '0.0.3-pr.2', '0.0.3'],
				rejects: ['0.0.3-alpha', '0.0.4-0', '0.0.4']
			});
		});

		it('finds the pre-release comparator anywhere in the set', () => {
			assertRange('>=1.0.0 <=1.2.3-rc', {
				matches: ['1.2.3-beta', '1.2.3-rc', '1.1.0'],
				rejects: ['1.2.3-rc.1', '1.2.3', '1.2.2-beta']
			});
			assertRange('<1.2.3 >=1.2.3-alpha', { matches: ['1.2.3-alpha', '1.2.3-beta'], rejects: ['1.2.3'] });
		});

		it('only counts pre-release comparators in the set that matched', () => {
			assertRange('>=1.2.4-beta.5 || >=1.0.0', {
				matches: ['1.2.4-beta.5', '1.2.4-beta.6', '1.5.0'],
				rejects: ['1.2.4-beta.1', '1.5.0-beta.6']
			});
			assertRange('1.2.3-beta.1 || 1.2.3-beta.3', {
				matches: ['1.2.3-beta.1', '1.2.3-beta.3'],
				rejects: ['1.2.3-beta.2']
			});
			assertRange('1.x || >=2.0.0-rc.1 <2.0.0', {
				matches: ['1.5.0', '2.0.0-rc.1', '2.0.0-rc.2'],
				rejects: ['1.5.0-rc.1', '2.0.0-beta', '2.0.0']
			});
		});

		it('compares numeric pre-release identifiers in ranges as numbers', () => {
			assertRange('>=1.2.3-beta.9', {
				matches: ['1.2.3-beta.9', '1.2.3-beta.10', '1.2.3-beta.99'],
				rejects: ['1.2.3-beta.8', '1.2.3-beta.1']
			});
			assertRange('>=1.2.3-beta.10', {
				matches: ['1.2.3-beta.10', '1.2.3-beta.11'],
				rejects: ['1.2.3-beta.9', '1.2.3-beta.2']
			});
			assertRange('1.2.3-beta.10', { matches: ['1.2.3-beta.10'], rejects: ['1.2.3-beta.1'] });
			assertRange('<1.2.3-10', { matches: ['1.2.3-9', '1.2.3-2'], rejects: ['1.2.3-10', '1.2.3-11', '1.2.3-a'] });
		});

		it('accepts every character of 0-9A-Za-z- in range pre-releases', () => {
			assertRange('1.2.3-0a.z9.A-.Z.10', {
				matches: ['1.2.3-0a.z9.A-.Z.10'],
				rejects: ['1.2.3-0a.z9.A-.Z.11', '1.2.3-0a.z9.A-.Z', '1.2.3']
			});
			assertRange('>=1.2.3-x-y.0', { matches: ['1.2.3-x-y.0', '1.2.3-x-y.1'], rejects: ['1.2.3-x-x.0'] });
		});
	});

	describe('invalid input', () => {
		it('returns false for an invalid version', () => {
			const invalid = ['nope', '', '1.2', '1.2.3.4', '01.2.3', '1.0.0-01', null, undefined, 123, {}];
			for (const version of invalid) {
				for (const range of ['*', '', '>=0.0.0', '1.x', '<99.0.0 || *']) {
					assert.equal(satisfies(version, range), false, `satisfies(${String(version)}, ${JSON.stringify(range)})`);
				}
			}
		});

		it('throws a TypeError for an invalid range', () => {
			const invalid = [
				'nope',
				'>=nope',
				'1.2.3.4',
				'01.2.3',
				'1.02.3',
				'1.2.03',
				'>=01.2',
				'1..3',
				'1.2.',
				'.1.2',
				'x.y.z',
				'1.2.3a',
				'1.2.3foo',
				'a1.2.3',
				'1.2.3-',
				'>=',
				'=',
				'<',
				'^',
				'~',
				'>= 1.2.3',
				'>>1.2.3',
				'==1.2.3',
				'=>1.2.3',
				'~>1.2.3',
				'^~1.2.3',
				'!1.2.3',
				'1.2.3 - 2.0.0',
				'1.2.3 || nope',
				'1.x || >=2.0.0 <nope',
				'1.2.3 | 2.0.0',
				'V1.2.3',
				null,
				undefined
			];
			for (const range of invalid) {
				assert.throws(() => satisfies('1.2.3', range), TypeError, `range ${JSON.stringify(range)}`);
			}
		});

		// The README's two rules clash here; the implementation checks the range first.
		it('throws for an invalid range even when the version is invalid too', () => {
			assert.throws(() => satisfies('nope', '>=nope'), TypeError);
			assert.throws(() => satisfies(null, '1.2.3.4'), TypeError);
		});

		// Not in the README, but it points at the comparator to fix.
		it('names the invalid comparator in the error', () => {
			assert.throws(() => satisfies('1.2.3', '>=1.0.0 <nope'), { name: 'TypeError', message: /nope/ });
			assert.throws(() => satisfies('1.2.3', '1.x || ~bad'), { name: 'TypeError', message: /bad/ });
		});
	});
});
