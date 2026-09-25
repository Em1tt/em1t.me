import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createInvoice, addDays } from '../src/index.js';

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

test('charges tax after applying a percentage or fixed-amount coupon', () => {
	for (const { coupon, discount, tax, total } of [
		{ coupon: { percent: 10 }, discount: 350, tax: 725, total: 3875 },
		{ coupon: { amount: 1000 }, discount: 1000, tax: 575, total: 3075 },
		{ coupon: { amount: 5000 }, discount: 3500, tax: 0, total: 0 }
	]) {
		const invoice = createInvoice({
			number: 'INV-DISCOUNT', customer: 'ACME', country: 'SK', issueDate: '2026-06-15', lines,
			coupon: { code: 'SUMMER', validFrom: '2026-06-01', validUntil: '2026-06-30', ...coupon }
		});
		assert.equal(invoice.subtotal, 3500);
		assert.equal(invoice.discount, discount);
		assert.equal(invoice.tax, tax);
		assert.equal(invoice.total, total);
	}
});

test('applies a coupon on its final valid day but not the following day', () => {
	const coupon = { code: 'SUMMER', percent: 10, validFrom: '2026-06-01', validUntil: '2026-06-30' };
	for (const [issueDate, discount, tax, total] of [
		['2026-06-30', 350, 725, 3875],
		['2026-07-01', 0, 805, 4305]
	]) {
		const invoice = createInvoice({ number: 'INV-SUMMER', customer: 'ACME', country: 'SK', issueDate, lines, coupon });
		assert.equal(invoice.discount, discount);
		assert.equal(invoice.tax, tax);
		assert.equal(invoice.total, total);
	}
});

test('creates empty draft invoices with zero totals, with or without a coupon', () => {
	for (const coupon of [
		undefined,
		{ code: 'PERCENT', percent: 10, validFrom: '2026-01-01', validUntil: '2026-01-31' },
		{ code: 'FIXED', amount: 500, validFrom: '2026-01-01', validUntil: '2026-01-31' }
	]) {
		assert.deepEqual(
			createInvoice({ number: 'DRAFT', customer: 'ACME', country: 'SK', issueDate: '2026-01-10', lines: [], coupon }),
			{
				number: 'DRAFT', customer: 'ACME', country: 'SK', issueDate: '2026-01-10', dueDate: '2026-01-24',
				items: [], subtotal: 0, discount: 0, tax: 0, total: 0
			}
		);
	}
});

test('adds calendar days across leap days and year boundaries, including zero and negative offsets', () => {
	assert.equal(addDays('2024-02-28', 1), '2024-02-29');
	assert.equal(addDays('2024-02-28', 2), '2024-03-01');
	assert.equal(addDays('2026-12-31', 1), '2027-01-01');
	assert.equal(addDays('2026-01-01', -1), '2025-12-31');
	assert.equal(addDays('2026-03-29', 0), '2026-03-29');
});

test('date arithmetic and invoice due dates are independent of time zone and daylight saving', () => {
	const moduleUrl = new URL('../src/index.js', import.meta.url).href;
	const script = `
		import { addDays, createInvoice } from ${JSON.stringify(moduleUrl)};
		const dates = [
			addDays('2026-03-20', 14),
			addDays('2026-03-01', 14),
			addDays('2026-10-20', 14),
			addDays('2026-04-03', -14),
			addDays('2026-11-03', -14),
			createInvoice({
				number: 'INV-DST', customer: 'ACME', country: 'US', issueDate: '2026-03-20', netDays: 14,
				lines: [{ description: 'Widget', quantity: 1, unitPrice: '10.00' }]
			}).dueDate
		];
		process.stdout.write(JSON.stringify(dates));
	`;
	for (const timeZone of ['UTC', 'Europe/Bratislava', 'America/New_York', 'Pacific/Auckland']) {
		const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
			env: { ...process.env, TZ: timeZone }, encoding: 'utf8'
		});
		assert.deepEqual(JSON.parse(output), [
			'2026-04-03', '2026-03-15', '2026-11-03', '2026-03-20', '2026-10-20', '2026-04-03'
		], timeZone);
	}
});
