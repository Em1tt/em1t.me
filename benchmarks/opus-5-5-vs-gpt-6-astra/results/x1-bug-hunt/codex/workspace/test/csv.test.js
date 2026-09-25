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

for (const [name, description, expected] of [
	['plain text', 'Pipe', 'Pipe'],
	['an empty description', '', ''],
	['commas', 'Pipe, steel', '"Pipe, steel"'],
	['a double quote', '12" pipe', '"12"" pipe"'],
	['multiple double quotes', '"12" pipe "steel"', '"""12"" pipe ""steel"""'],
	['a carriage return', 'Pipe\rsteel', '"Pipe\rsteel"'],
	['a line feed', 'Pipe\nsteel', '"Pipe\nsteel"'],
	['CRLF with commas and quotes', '12" pipe,\r\nsteel', '"12"" pipe,\r\nsteel"']
]) {
	test(`exports RFC 4180 fields containing ${name}`, () => {
		const invoice = { items: [{ description, quantity: 2, unitCents: 125, totalCents: 250 }] };
		assert.equal(toCsv(invoice), `Description,Quantity,Unit price,Total\r\n${expected},2,$1.25,$2.50\r\n`);
	});
}

test('exports every line with the requested currency', () => {
	const invoice = { items: [
		{ description: '12" pipe', quantity: 2, unitCents: 125, totalCents: 250 },
		{ description: 'Bolts', quantity: 1000, unitCents: 125, totalCents: 125000 }
	] };
	assert.equal(toCsv(invoice, 'GBP'), 'Description,Quantity,Unit price,Total\r\n"12"" pipe",2,£1.25,£2.50\r\nBolts,1000,£1.25,"£1,250.00"\r\n');
});

test('exports the header for an invoice with no lines', () => {
	assert.equal(toCsv({ items: [] }), 'Description,Quantity,Unit price,Total\r\n');
});
