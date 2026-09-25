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

test('formats cents', () => {
	assert.equal(formatAmount(123456), '$1,234.56');
	assert.equal(formatAmount(5), '$0.05');
	assert.equal(formatAmount(1000, 'EUR'), '€10.00');
});
