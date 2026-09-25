import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from './support/semver.js';

const version = (major, minor, patch, prerelease = []) => ({ major, minor, patch, prerelease });

function assertParses(cases) {
	for (const [text, expected] of cases) {
		assert.deepEqual(parse(text), expected, `parse(${JSON.stringify(text)})`);
	}
}

function assertInvalid(texts) {
	for (const text of texts) {
		assert.equal(parse(text), null, `parse(${JSON.stringify(text)}) should be null`);
	}
}

describe('parse', () => {
	it('parses a plain version', () => {
		assert.deepEqual(parse('1.2.3'), { major: 1, minor: 2, patch: 3, prerelease: [] });
	});

	describe('MAJOR.MINOR.PATCH', () => {
		it('turns each part into a number', () => {
			assertParses([
				['0.0.0', version(0, 0, 0)],
				['3.2.1', version(3, 2, 1)],
				['1.10.100', version(1, 10, 100)],
				['9.99.999', version(9, 99, 999)],
				['10.20.30', version(10, 20, 30)],
				['123.4567.89012', version(123, 4567, 89012)]
			]);
		});

		it('allows 0 but no leading zeros', () => {
			assertParses([
				['0.2.3', version(0, 2, 3)],
				['1.0.3', version(1, 0, 3)],
				['1.2.0', version(1, 2, 0)]
			]);
			assertInvalid(['01.2.3', '1.02.3', '1.2.03', '00.0.0', '0.00.0', '0.0.00', '007.0.0']);
		});

		it('requires all three parts', () => {
			assertInvalid(['1.2', '1', '1.2.', '1..3', '.2.3', '..', '1.2.-', '1.2.x', '1.x.3', '*']);
		});

		it('rejects anything else around or between the parts', () => {
			assertInvalid([
				'1.2.3.4',
				'1.2.3x',
				'x1.2.3',
				'=1.2.3',
				'>=1.2.3',
				'^1.2.3',
				'-1.2.3',
				'1.-2.3',
				'1-2-3',
				'1_2_3',
				'1 .2.3',
				'1. 2.3',
				'1.2.3 1.2.4',
				'a.b.c',
				'1.2.3a',
				'١.٢.٣'
			]);
		});

		it('rejects the empty string and blank text', () => {
			assertInvalid(['', ' ', '\t\n']);
		});
	});

	describe('surrounding whitespace and a leading v', () => {
		it("parses ' v1.2.3 ' as 1.2.3", () => {
			assert.deepEqual(parse(' v1.2.3 '), version(1, 2, 3));
		});

		it('allows a leading v', () => {
			assertParses([
				['v1.2.3', version(1, 2, 3)],
				['v0.0.0', version(0, 0, 0)],
				['v1.2.3-beta.1+build', version(1, 2, 3, ['beta', 1])]
			]);
		});

		it('allows whitespace on either side, or both', () => {
			assertParses([
				['  1.2.3', version(1, 2, 3)],
				['1.2.3  ', version(1, 2, 3)],
				['\t1.2.3\n', version(1, 2, 3)],
				['  v1.2.3-rc.1+b.2\t', version(1, 2, 3, ['rc', 1])]
			]);
		});

		it('allows only one lowercase v, right before the number', () => {
			assertInvalid(['V1.2.3', 'vv1.2.3', 'v 1.2.3', ' v 1.2.3 ', 'v', 'v.1.2.3', '1.2.3v', 'av1.2.3']);
		});

		it('rejects whitespace inside the version', () => {
			assertInvalid(['1.2.3 -beta', '1.2.3- beta', '1.2.3-beta .1', '1.2.3 +build', '1.2.3+ build']);
		});
	});

	describe('pre-release', () => {
		it("parses 1.2.3-beta.10 as ['beta', 10]", () => {
			assert.deepEqual(parse('1.2.3-beta.10'), version(1, 2, 3, ['beta', 10]));
		});

		it('splits dot-separated identifiers, turning numeric ones into numbers', () => {
			assertParses([
				['1.0.0-alpha', version(1, 0, 0, ['alpha'])],
				['1.0.0-alpha.1', version(1, 0, 0, ['alpha', 1])],
				['1.0.0-alpha.beta', version(1, 0, 0, ['alpha', 'beta'])],
				['1.0.0-0.3.7', version(1, 0, 0, [0, 3, 7])],
				['1.0.0-x.7.z.92', version(1, 0, 0, ['x', 7, 'z', 92])],
				['1.0.0-x-y-z.--', version(1, 0, 0, ['x-y-z', '--'])],
				['2.4.6-rc.1.final.20', version(2, 4, 6, ['rc', 1, 'final', 20])]
			]);
		});

		it('accepts numeric identifiers without leading zeros', () => {
			assertParses([
				['1.0.0-0', version(1, 0, 0, [0])],
				['1.0.0-1', version(1, 0, 0, [1])],
				['1.0.0-9.1', version(1, 0, 0, [9, 1])],
				['1.0.0-109.0.901', version(1, 0, 0, [109, 0, 901])],
				['1.0.0-x.0.10', version(1, 0, 0, ['x', 0, 10])]
			]);
		});

		it('rejects numeric identifiers with leading zeros, like 1.0.0-01', () => {
			assertInvalid(['1.0.0-01', '1.0.0-00', '1.0.0-007', '1.0.0-alpha.01', '1.0.0-0.00', '1.0.0-1.2.03']);
		});

		it('keeps identifiers that are not all digits as strings', () => {
			assertParses([
				['1.0.0-0a', version(1, 0, 0, ['0a'])],
				['1.0.0-01a', version(1, 0, 0, ['01a'])],
				['1.0.0-10a', version(1, 0, 0, ['10a'])],
				['1.0.0-rc1', version(1, 0, 0, ['rc1'])],
				['1.0.0-1-2', version(1, 0, 0, ['1-2'])],
				['1.0.0-0x1', version(1, 0, 0, ['0x1'])],
				['1.0.0-1e5', version(1, 0, 0, ['1e5'])],
				['1.0.0--1', version(1, 0, 0, ['-1'])],
				['1.0.0-0.9a', version(1, 0, 0, [0, '9a'])],
				['1.0.0-0A.is.legal', version(1, 0, 0, ['0A', 'is', 'legal'])]
			]);
		});

		it('accepts every character of 0-9A-Za-z- in identifiers', () => {
			assertParses([
				['1.0.0-a', version(1, 0, 0, ['a'])],
				['1.0.0-z', version(1, 0, 0, ['z'])],
				['1.0.0-A', version(1, 0, 0, ['A'])],
				['1.0.0-Z', version(1, 0, 0, ['Z'])],
				['1.0.0--', version(1, 0, 0, ['-'])],
				['1.0.0-x09azAZ-', version(1, 0, 0, ['x09azAZ-'])],
				['1.0.0-0.a.z.A.Z.-.x09azAZ-', version(1, 0, 0, [0, 'a', 'z', 'A', 'Z', '-', 'x09azAZ-'])]
			]);
		});

		it('rejects empty identifiers', () => {
			assertInvalid(['1.0.0-', '1.0.0-.', '1.0.0-alpha.', '1.0.0-.alpha', '1.0.0-alpha..1', '1.0.0-+build']);
		});

		it('rejects characters outside 0-9A-Za-z-', () => {
			assertInvalid([
				'1.0.0-alpha_1',
				'1.0.0-alpha 1',
				'1.0.0-alpha!',
				'1.0.0-alpha/1',
				'1.0.0-alpha$',
				'1.0.0-é',
				'1.0.0-ä.1',
				'1.0.0-alpha+b+c'
			]);
		});
	});

	describe('build metadata', () => {
		it('parses 1.2.3+build.5 as 1.2.3', () => {
			assert.deepEqual(parse('1.2.3+build.5'), version(1, 2, 3));
		});

		it('is allowed after the version or its pre-release, and ignored', () => {
			assertParses([
				['1.0.0+20130313144700', version(1, 0, 0)],
				['1.0.0-beta+exp.sha.5114f85', version(1, 0, 0, ['beta'])],
				['1.0.0-rc.1+build.1', version(1, 0, 0, ['rc', 1])],
				['1.0.0+21AF26D3----117B344092BD', version(1, 0, 0)],
				['1.0.0+001', version(1, 0, 0)],
				['1.0.0+09azAZ-', version(1, 0, 0)],
				['1.0.0+x.09azAZ-', version(1, 0, 0)],
				['1.0.0-0+0', version(1, 0, 0, [0])]
			]);
		});

		it('rejects empty build metadata or identifiers', () => {
			assertInvalid(['1.2.3+', '1.2.3+.', '1.2.3+build.', '1.2.3+.build', '1.2.3+build..5', '1.0.0-beta+']);
		});

		it('rejects characters outside 0-9A-Za-z-', () => {
			assertInvalid(['1.2.3+build_5', '1.2.3+build 5', '1.2.3+build+5', '1.2.3+build/5', '1.2.3+ä']);
		});
	});

	describe('anything that is not a string', () => {
		it('returns null', () => {
			const notStrings = [
				undefined,
				null,
				123,
				1.2,
				true,
				{},
				[],
				['1.2.3'],
				{ major: 1, minor: 2, patch: 3, prerelease: [] },
				{ toString: () => '1.2.3' },
				() => '1.2.3',
				Symbol('1.2.3'),
				10n
			];
			for (const value of notStrings) {
				assert.equal(parse(value), null, `parse(${String(value)})`);
			}
		});
	});
});
