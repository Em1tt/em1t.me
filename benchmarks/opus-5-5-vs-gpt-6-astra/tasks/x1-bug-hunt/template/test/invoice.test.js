import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInvoice, addDays } from '../src/invoice.js';

const lines = [
	{ description: 'Widget', quantity: 3, unitPrice: '10.00' },
	{ description: 'Gadget', quantity: 2, unitPrice: '2.50' }
];

test('totals an invoice without a coupon', () => {
	const invoice = createInvoice({ number: 'INV-1', customer: 'ACME', country: 'SK', issueDate: '2026-01-10', lines });
	assert.equal(invoice.subtotal, 3500);
	assert.equal(invoice.discount, 0);
	assert.equal(invoice.tax, 805);
	assert.equal(invoice.total, 4305);
	assert.equal(invoice.dueDate, '2026-01-24');
});

test('US invoices have no tax', () => {
	const invoice = createInvoice({ number: 'INV-2', customer: 'ACME', country: 'US', issueDate: '2026-01-10', lines });
	assert.equal(invoice.tax, 0);
});

test('adds days', () => {
	assert.equal(addDays('2026-01-30', 5), '2026-02-04');
});
