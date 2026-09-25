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

const summer = { code: 'SUMMER', percent: 20, validFrom: '2026-06-01', validUntil: '2026-06-30' };

test('prices lines to the exact cent', () => {
	const invoice = createInvoice({
		number: 'INV-4',
		customer: 'ACME',
		country: 'US',
		issueDate: '2026-01-10',
		lines: [
			{ description: 'Cable', quantity: 1, unitPrice: '19.99' },
			{ description: 'Clip', quantity: 3, unitPrice: '0.29' }
		]
	});
	assert.deepEqual(invoice.items.map((item) => item.unitCents), [1999, 29]);
	assert.equal(invoice.subtotal, 2086);
	assert.equal(invoice.total, 2086);
});

test('applies a coupon on its last day, not after', () => {
	const lastDay = createInvoice({ number: 'INV-5', customer: 'ACME', country: 'US', issueDate: '2026-06-30', lines, coupon: summer });
	assert.equal(lastDay.discount, 700);
	assert.equal(lastDay.total, 2800);
	const dayAfter = createInvoice({ number: 'INV-6', customer: 'ACME', country: 'US', issueDate: '2026-07-01', lines, coupon: summer });
	assert.equal(dayAfter.discount, 0);
	assert.equal(dayAfter.total, 3500);
});

test('charges tax on the subtotal after the discount', () => {
	const percentOff = createInvoice({ number: 'INV-7', customer: 'ACME', country: 'SK', issueDate: '2026-06-15', lines, coupon: summer });
	assert.equal(percentOff.discount, 700);
	assert.equal(percentOff.tax, 644); // 23% of 2800
	assert.equal(percentOff.total, 3444);

	const fiveOff = { code: 'FIVE', amount: 500, validFrom: '2026-06-01', validUntil: '2026-06-30' };
	const amountOff = createInvoice({ number: 'INV-8', customer: 'ACME', country: 'SK', issueDate: '2026-06-15', lines, coupon: fiveOff });
	assert.equal(amountOff.discount, 500);
	assert.equal(amountOff.tax, 690); // 23% of 3000
	assert.equal(amountOff.total, 3690);
});

test('creates an empty draft invoice', () => {
	const drafts = [
		createInvoice({ number: 'INV-9', customer: 'ACME', country: 'SK', issueDate: '2026-06-15', lines: [] }),
		createInvoice({ number: 'INV-10', customer: 'ACME', country: 'SK', issueDate: '2026-06-15' }),
		createInvoice({ number: 'INV-11', customer: 'ACME', country: 'SK', issueDate: '2026-06-15', lines: [], coupon: summer })
	];
	for (const draft of drafts) {
		assert.deepEqual(draft.items, []);
		assert.equal(draft.subtotal, 0);
		assert.equal(draft.discount, 0);
		assert.equal(draft.tax, 0);
		assert.equal(draft.total, 0);
		assert.equal(draft.dueDate, '2026-06-29');
	}
});
