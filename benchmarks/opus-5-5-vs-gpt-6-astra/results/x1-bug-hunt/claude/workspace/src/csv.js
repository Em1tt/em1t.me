import { formatAmount } from './money.js';

function field(value) {
	// Quotes inside a quoted field are doubled: 12" pipe → "12"" pipe".
	if (/[",\r\n]/.test(value)) return `"${String(value).replace(/"/g, '""')}"`;
	return value;
}

/** The invoice's lines as CSV (RFC 4180, CRLF line endings), with a header row. */
export function toCsv(invoice, currency = 'USD') {
	const rows = [['Description', 'Quantity', 'Unit price', 'Total']];
	for (const item of invoice.items) {
		rows.push([item.description, String(item.quantity), formatAmount(item.unitCents, currency), formatAmount(item.totalCents, currency)]);
	}
	return rows.map((row) => row.map(field).join(',')).join('\r\n') + '\r\n';
}
