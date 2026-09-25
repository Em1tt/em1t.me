import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, createInvoice } from '../src/invoice.js';

// Setting process.env.TZ switches this process to that time zone. These tests have a file of their
// own because node --test runs each file in a separate process.
const timeZones = [
	// [time zone, its offset from UTC on 20 March 2026, to check that the switch worked]
	['UTC', 'GMT+0000'],
	['Europe/Bratislava', 'GMT+0100'],
	['America/New_York', 'GMT-0400'],
	['Australia/Sydney', 'GMT+1100'],
	['Pacific/Auckland', 'GMT+1300']
];

// [date, days, expected]. All but the last two cross a change of the clocks somewhere.
const cases = [
	['2026-03-20', 14, '2026-04-03'], // the reported invoice: clocks go forward in the EU on 29 March
	['2026-03-29', 1, '2026-03-30'], // from the day the EU changes
	['2026-03-01', 14, '2026-03-15'], // forward in the US on 8 March
	['2026-09-20', 14, '2026-10-04'], // forward in New Zealand on 27 September, Australia on 4 October
	['2026-10-20', 14, '2026-11-03'], // back in the EU on 25 October, the US on 1 November
	['2026-12-25', 14, '2027-01-08'],
	['2028-02-20', 14, '2028-03-05']
];

function inTimeZone(timeZone, fn) {
	const original = process.env.TZ;
	process.env.TZ = timeZone;
	try {
		fn();
	} finally {
		if (original === undefined) delete process.env.TZ;
		else process.env.TZ = original;
	}
}

test('adds days in any time zone, across changes of the clocks', () => {
	for (const [timeZone, offset] of timeZones) {
		inTimeZone(timeZone, () => {
			assert.ok(new Date('2026-03-20').toString().includes(offset), `running in ${timeZone}`);
			for (const [date, days, expected] of cases) {
				assert.equal(addDays(date, days), expected, `${date} + ${days} days in ${timeZone}`);
			}
		});
	}
});

test('an invoice issued on 20 March 2026 with 14 days to pay is due on 3 April', () => {
	for (const [timeZone] of timeZones) {
		inTimeZone(timeZone, () => {
			const invoice = createInvoice({ number: 'INV-1', customer: 'ACME', country: 'SK', issueDate: '2026-03-20', netDays: 14, lines: [] });
			assert.equal(invoice.dueDate, '2026-04-03', `in ${timeZone}`);
		});
	}
});
