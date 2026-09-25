import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, formatAmount } from '../src/money.js';

test('parses whole and decimal amounts', () => {
	assert.equal(parseAmount('10'), 1000);
	assert.equal(parseAmount('2.50'), 250);
	assert.equal(parseAmount('1,234.50'), 123450);
});

test('rejects nonsense', () => {
	assert.throws(() => parseAmount('ten'));
	assert.throws(() => parseAmount('1.234'));
});

test('parses decimal prices exactly into cents', () => {
	assert.equal(parseAmount('19.99'), 1999);
	assert.equal(parseAmount('0.29'), 29);
	assert.equal(parseAmount('-19.99'), -1999);
	assert.equal(parseAmount('-0.29'), -29);
	assert.equal(parseAmount('  -1,234.5  '), -123450);
	assert.equal(parseAmount('-5'), -500);
	assert.equal(parseAmount(19.99), 1999);
});

test('formats cents', () => {
	assert.equal(formatAmount(123456), '$1,234.56');
	assert.equal(formatAmount(5), '$0.05');
	assert.equal(formatAmount(1000, 'EUR'), '€10.00');
});

test('formats credits with the sign before the currency symbol', () => {
	assert.equal(formatAmount(-500), '-$5.00');
	assert.equal(formatAmount(-5), '-$0.05');
	assert.equal(formatAmount(-123456), '-$1,234.56');
	assert.equal(formatAmount(-500, 'EUR'), '-\u20ac5.00');
	assert.equal(formatAmount(-500, 'GBP'), '-\u00a35.00');
	assert.equal(formatAmount(0), '$0.00');
});
