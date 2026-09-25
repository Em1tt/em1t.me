import { test } from 'node:test';
import assert from 'node:assert/strict';
import { satisfies } from '../src/semver.js';

function assertRange(range, included, excluded) {
	for (const version of included) {
		assert.equal(satisfies(version, range), true, `${JSON.stringify(version)} should satisfy ${JSON.stringify(range)}`);
	}
	for (const version of excluded) {
		assert.equal(satisfies(version, range), false, `${JSON.stringify(version)} should not satisfy ${JSON.stringify(range)}`);
	}
}

test('full-version comparators distinguish lower, equal and higher versions', () => {
	const below = ['0.99.99', '1.0.99', '1.1.99', '1.2.0', '1.2.2'];
	const equal = ['1.2.3', 'v1.2.3', '  1.2.3  ', '1.2.3+build.42'];
	const above = ['1.2.4', '1.2.30', '1.3.0', '1.20.0', '2.0.0', '10.0.0'];
	assertRange('1.2.3', equal, [...below, ...above]);
	assertRange('=1.2.3', equal, [...below, ...above]);
	assertRange('>1.2.3', above, [...below, ...equal]);
	assertRange('>=1.2.3', [...equal, ...above], below);
	assertRange('<1.2.3', below, [...equal, ...above]);
	assertRange('<=1.2.3', [...below, ...equal], above);
});

test('full-version comparators handle zero as a real version component', () => {
	const zero = ['0.0.0', '0.0.0+build'];
	const positive = ['0.0.1', '0.1.0', '1.0.0'];
	assertRange('0.0.0', zero, positive);
	assertRange('=0.0.0', zero, positive);
	assertRange('>0.0.0', positive, zero);
	assertRange('>=0.0.0', [...zero, ...positive], []);
	assertRange('<0.0.0', [], [...zero, ...positive]);
	assertRange('<=0.0.0', zero, positive);
	assertRange('=10.20.30', ['10.20.30'], ['10.20.3', '10.2.30', '1.20.30']);
});

const caretCases = [
	['^1.2.3', ['1.2.3', '1.2.4', '1.3.0', '1.99.99'], ['0.99.99', '1.2.2', '2.0.0', '2.0.1']],
	['^2.0.0', ['2.0.0', '2.0.1', '2.99.99'], ['1.99.99', '3.0.0']],
	['^10.20.30', ['10.20.30', '10.20.31', '10.21.0', '10.99.99'], ['10.20.29', '11.0.0']],
	['^0.2.3', ['0.2.3', '0.2.4', '0.2.99'], ['0.1.99', '0.2.2', '0.3.0', '0.3.3', '1.0.0']],
	['^0.10.20', ['0.10.20', '0.10.21', '0.10.99'], ['0.9.99', '0.10.19', '0.11.0', '1.0.0']],
	['^0.0.3', ['0.0.3', '0.0.3+release'], ['0.0.0', '0.0.2', '0.0.4', '0.1.0', '1.0.0']],
	['^0.0.0', ['0.0.0'], ['0.0.1', '0.1.0', '1.0.0']],
];

for (const [range, included, excluded] of caretCases) {
	test(`${range} preserves the left-most nonzero component and both boundaries`, () => {
		assertRange(range, included, excluded);
	});
}

const tildeCases = [
	['~1.2.3', ['1.2.3', '1.2.4', '1.2.99'], ['1.1.99', '1.2.2', '1.3.0', '1.3.3', '2.0.0']],
	['~1.0.0', ['1.0.0', '1.0.1', '1.0.99'], ['0.99.99', '1.1.0', '2.0.0']],
	['~0.2.3', ['0.2.3', '0.2.4', '0.2.99'], ['0.1.99', '0.2.2', '0.3.0', '1.0.0']],
	['~0.0.3', ['0.0.3', '0.0.4', '0.0.99'], ['0.0.0', '0.0.2', '0.1.0', '1.0.0']],
	['~0.0.0', ['0.0.0', '0.0.1', '0.0.99'], ['0.1.0', '1.0.0']],
	['~10.20.30', ['10.20.30', '10.20.31', '10.20.99'], ['10.20.29', '10.21.0', '11.0.0']],
];

for (const [range, included, excluded] of tildeCases) {
	test(`${range} permits patch changes within its minor version`, () => {
		assertRange(range, included, excluded);
	});
}

const partialCases = [
	{
		forms: ['0', '0.x', '0.*'],
		included: ['0.0.0', '0.0.1', '0.1.0', '0.99.99'],
		excluded: ['1.0.0', '1.0.1', '10.0.0'],
	},
	{
		forms: ['1', '1.x', '1.*'],
		included: ['1.0.0', '1.0.1', '1.2.3', '1.99.99'],
		excluded: ['0.99.99', '2.0.0', '2.0.1', '10.0.0'],
	},
	{
		forms: ['10', '10.x', '10.*'],
		included: ['10.0.0', '10.0.1', '10.20.30', '10.99.99'],
		excluded: ['1.0.0', '9.99.99', '11.0.0'],
	},
	{
		forms: ['0.0', '0.0.x', '0.0.*'],
		included: ['0.0.0', '0.0.1', '0.0.99'],
		excluded: ['0.1.0', '0.1.1', '1.0.0'],
	},
	{
		forms: ['1.0', '1.0.x', '1.0.*'],
		included: ['1.0.0', '1.0.1', '1.0.99'],
		excluded: ['0.99.99', '1.1.0', '2.0.0'],
	},
	{
		forms: ['1.2', '1.2.x', '1.2.*'],
		included: ['1.2.0', '1.2.1', '1.2.3', '1.2.99'],
		excluded: ['0.2.0', '1.1.99', '1.3.0', '1.3.1', '2.2.0'],
	},
	{
		forms: ['10.20', '10.20.x', '10.20.*'],
		included: ['10.20.0', '10.20.1', '10.20.99'],
		excluded: ['1.20.0', '10.19.99', '10.21.0', '11.0.0'],
	},
];

for (const { forms, included, excluded } of partialCases) {
	test(`${forms.join(', ')} cover the entire partial-version span`, () => {
		for (const range of forms) {
			assertRange(range, included, excluded);
			assertRange(`=${range}`, included, excluded);
		}
	});
}

test('relational operators on a partial version compare against its entire span', () => {
	const spans = [
		{
			forms: ['1', '1.x', '1.*'],
			below: ['0.0.0', '0.99.99'],
			inside: ['1.0.0', '1.0.1', '1.2.3', '1.99.99'],
			above: ['2.0.0', '2.0.1', '10.0.0'],
		},
		{
			forms: ['1.2', '1.2.x', '1.2.*'],
			below: ['0.0.0', '1.0.0', '1.1.99'],
			inside: ['1.2.0', '1.2.1', '1.2.99'],
			above: ['1.3.0', '1.3.1', '2.0.0'],
		},
		{
			forms: ['0', '0.x', '0.*'],
			below: [],
			inside: ['0.0.0', '0.0.1', '0.99.99'],
			above: ['1.0.0', '1.0.1', '10.0.0'],
		},
		{
			forms: ['0.0', '0.0.x', '0.0.*'],
			below: [],
			inside: ['0.0.0', '0.0.1', '0.0.99'],
			above: ['0.1.0', '0.1.1', '1.0.0'],
		},
		{
			forms: ['10.20', '10.20.x', '10.20.*'],
			below: ['0.0.0', '10.19.99'],
			inside: ['10.20.0', '10.20.1', '10.20.99'],
			above: ['10.21.0', '10.21.1', '11.0.0'],
		},
	];
	for (const { forms, below, inside, above } of spans) {
		for (const partial of forms) {
			assertRange(`>${partial}`, above, [...below, ...inside]);
			assertRange(`>=${partial}`, [...inside, ...above], below);
			assertRange(`<${partial}`, below, [...inside, ...above]);
			assertRange(`<=${partial}`, [...below, ...inside], above);
		}
	}
});

test('global wildcards and the empty range admit stable versions of any magnitude', () => {
	for (const range of ['*', 'x', '', ' ', ' \t\n ']) {
		assertRange(range, ['0.0.0', '0.1.2', '1.2.3', '10.20.30', '999.888.777', 'v1.2.3', ' 1.2.3+build.7 '], []);
	}
});

test('all comparators in one set must hold, regardless of their order', () => {
	for (const range of ['>=1.2.3 <2.0.0', '<2.0.0 >=1.2.3']) {
		assertRange(range, ['1.2.3', '1.2.4', '1.99.99'], ['0.99.99', '1.2.2', '2.0.0', '2.0.1']);
	}
	assertRange('>=1.0.0 <3.0.0 >=2.0.0 <2.5.0', ['2.0.0', '2.4.99'], ['1.0.0', '1.99.99', '2.5.0', '2.99.99', '3.0.0']);
	assertRange('>=1.2.3 <=1.2.3', ['1.2.3'], ['1.2.2', '1.2.4']);
	assertRange('>1.2.3 <=1.2.3', [], ['1.2.2', '1.2.3', '1.2.4']);
	assertRange('>=2.0.0 <1.0.0', [], ['0.0.0', '1.0.0', '2.0.0', '3.0.0']);
	assertRange('1.x 1.2.x', ['1.2.0', '1.2.99'], ['1.0.0', '1.1.99', '1.3.0', '2.0.0']);
	assertRange('^1.2.3 ~1.3.0', ['1.3.0', '1.3.99'], ['1.2.3', '1.2.99', '1.4.0', '2.0.0']);
	assertRange('* >=1.0.0 x <2.0.0', ['1.0.0', '1.99.99'], ['0.99.99', '2.0.0']);
});

test('OR sets are independent alternatives and each still requires every comparator', () => {
	assertRange('1.2.3 || 2.3.4', ['1.2.3', '2.3.4'], ['1.2.2', '1.2.4', '2.3.3', '2.3.5']);
	assertRange('1.2.3 || 2.3.4 || 3.4.5', ['1.2.3', '2.3.4', '3.4.5'], ['0.0.0', '2.3.5', '4.0.0']);
	assertRange('>=1.0.0 <2.0.0 || >=3.0.0 <4.0.0', ['1.0.0', '1.99.99', '3.0.0', '3.99.99'], ['0.99.99', '2.0.0', '2.99.99', '4.0.0', '5.0.0']);
	assertRange('>=2.0.0 <1.0.0 || 3.0.0', ['3.0.0'], ['0.0.0', '1.0.0', '2.0.0', '3.0.1']);
	assertRange('1.2.3 || *', ['0.0.0', '1.2.3', '99.99.99'], []);
	assertRange('* || 1.2.3', ['0.0.0', '1.2.3', '99.99.99'], []);
});

test('range whitespace separates comparators and trims each alternative', () => {
	const included = ['1.2.3', '1.99.99', '3.0.0'];
	const excluded = ['1.2.2', '2.0.0', '2.99.99', '3.0.1'];
	for (const range of [
		'  >=1.2.3   <2.0.0   ||  3.0.0  ',
		'\t>=1.2.3\t<2.0.0\n||\r\n3.0.0\t',
		'>=1.2.3 <2.0.0||3.0.0',
	]) {
		assertRange(range, included, excluded);
	}
});
