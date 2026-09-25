import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInvoice } from '../src/invoice.js';
import { toCsv } from '../src/csv.js';

test('exports lines as CSV', () => {
	const invoice = createInvoice({
		number: 'INV-3',
		customer: 'ACME',
		country: 'US',
		issueDate: '2026-01-10',
		lines: [{ description: 'Bolts, large', quantity: 1000, unitPrice: '1.25' }]
	});
	assert.equal(toCsv(invoice), 'Description,Quantity,Unit price,Total\r\n"Bolts, large",1000,$1.25,"$1,250.00"\r\n');
});

test('escapes double quotes in fields', () => {
	const invoice = createInvoice({
		number: 'INV-4',
		customer: 'ACME',
		country: 'US',
		issueDate: '2026-01-10',
		lines: [
			{ description: '12" pipe', quantity: 2, unitPrice: '3.50' },
			{ description: 'Elbow, 3/4"', quantity: 1, unitPrice: '1,200.00' }
		]
	});
	assert.equal(
		toCsv(invoice),
		'Description,Quantity,Unit price,Total\r\n"12"" pipe",2,$3.50,$7.00\r\n"Elbow, 3/4""",1,"$1,200.00","$1,200.00"\r\n'
	);
});

test('exports credit notes with the minus sign first', () => {
	const creditNote = createInvoice({
		number: 'CN-1',
		customer: 'ACME',
		country: 'US',
		issueDate: '2026-01-10',
		lines: [{ description: 'Refund', quantity: 1, unitPrice: '-5' }]
	});
	assert.equal(toCsv(creditNote), 'Description,Quantity,Unit price,Total\r\nRefund,1,-$5.00,-$5.00\r\n');
});

test('exports an empty draft invoice as just the header', () => {
	const draft = createInvoice({ number: 'INV-5', customer: 'ACME', country: 'US', issueDate: '2026-01-10', lines: [] });
	assert.equal(toCsv(draft), 'Description,Quantity,Unit price,Total\r\n');
});
