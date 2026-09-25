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
