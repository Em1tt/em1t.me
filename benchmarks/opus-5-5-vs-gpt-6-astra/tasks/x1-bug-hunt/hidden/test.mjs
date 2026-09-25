// Hidden tests for X1, the bug hunt. Run: node test.mjs <workspace> <out-dir>
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checks, same } from '../../../tools/harness.mjs';

const [, , workspace, out] = process.argv;
mkdirSync(out, { recursive: true });
const index = pathToFileURL(join(workspace, 'src', 'index.js')).href;
let lib;
try {
	lib = await import(index);
} catch (error) {
	writeFileSync(join(out, 'result.json'), JSON.stringify({ passed: 0, total: 13, results: [], note: `import failed: ${error.message}` }, null, 2));
	process.exit(0);
}
const { parseAmount, formatAmount, RATES, taxFor, isCouponValid, discountFor, addDays, createInvoice, toCsv } = lib;
const c = checks();
const line = (description, quantity, unitPrice) => ({ description, quantity, unitPrice });
const base = { number: 'T-1', customer: 'Test', country: 'SK', issueDate: '2026-06-30' };

await c.check('bug 1: amounts parse to the exact cent', () => {
	const wrong = [];
	for (let i = 0; i <= 9999; i++) {
		const text = (i / 100).toFixed(2);
		if (parseAmount(text) !== i) wrong.push(text);
	}
	const more = [['19.99', 1999], ['0.29', 29], ['-19.99', -1999], ['1,234.57', 123457], ['4.35', 435], ['0.1', 10], ['1000000.07', 100000007]].filter(([t, v]) => parseAmount(t) !== v);
	return (wrong.length === 0 && more.length === 0) || { wrong: wrong.slice(0, 5), count: wrong.length, more };
});
await c.check('bug 2: coupons are valid on their last day', () => {
	const coupon = { code: 'SUMMER', percent: 10, validFrom: '2026-06-01', validUntil: '2026-06-30' };
	const got = ['2026-05-31', '2026-06-01', '2026-06-15', '2026-06-30', '2026-07-01'].map((d) => isCouponValid(coupon, d));
	const invoice = createInvoice({ ...base, country: 'US', lines: [line('Cable', 1, '100.00')], coupon });
	return (same(got, [false, true, true, true, false]) && invoice.discount === 1000) || { got, discount: invoice.discount };
});
await c.check('bug 3: tax is charged after the discount', () => {
	const coupon = { code: 'SUMMER', percent: 10, validFrom: '2026-06-01', validUntil: '2026-06-30' };
	const a = createInvoice({ ...base, lines: [line('Desk', 1, '100.00')], coupon });
	const fixed = createInvoice({ ...base, country: 'DE', lines: [line('Lamp', 2, '25.00')], coupon: { code: 'FIVER', amount: 500, validFrom: '2026-01-01', validUntil: '2026-12-31' } });
	const got = [a.subtotal, a.discount, a.tax, a.total, fixed.tax, fixed.total];
	return same(got, [10000, 1000, 2070, 11070, 855, 5355]) || { got };
});
await c.check('bug 4: CSV doubles quotes inside quoted fields', () => {
	const invoice = createInvoice({ ...base, country: 'US', lines: [line('12" pipe', 2, '3.00'), line('Say "hi", then\nleave', 1, '1.00'), line('Plain', 1, '1.00')] });
	const got = toCsv(invoice);
	const want = 'Description,Quantity,Unit price,Total\r\n"12"" pipe",2,$3.00,$6.00\r\n"Say ""hi"", then\nleave",1,$1.00,$1.00\r\nPlain,1,$1.00,$1.00\r\n';
	return got === want || { got };
});
await c.check('bug 5: negative amounts read -$5.00', () => {
	const got = [formatAmount(-500), formatAmount(-5), formatAmount(-123456, 'EUR'), formatAmount(-100, 'GBP'), formatAmount(0)];
	return same(got, ['-$5.00', '-$0.05', '-€1,234.56', '-£1.00', '$0.00']) || { got };
});
await c.check('bug 6: an invoice with no lines', () => {
	const invoice = createInvoice({ ...base, lines: [] });
	const got = [invoice.items.length, invoice.subtotal, invoice.discount, invoice.tax, invoice.total];
	return same(got, [0, 0, 0, 0, 0]) || { got };
});
await c.check('bug 7: due dates across daylight saving time', () => {
	const invoice = createInvoice({ ...base, issueDate: '2026-03-20', lines: [line('A', 1, '1.00')] });
	const got = [addDays('2026-03-20', 14), addDays('2026-10-20', 14), addDays('2026-03-29', 1), addDays('2026-12-31', 1), addDays('2028-02-28', 1), invoice.dueDate];
	return same(got, ['2026-04-03', '2026-11-03', '2026-03-30', '2027-01-01', '2028-02-29', '2026-04-03']) || { got };
});
await c.check('bug 7: addDays is right in other time zones', () => {
	const script = `import(${JSON.stringify(index)}).then((m) => console.log(JSON.stringify([m.addDays('2026-03-20', 14), m.addDays('2026-10-20', 14), m.addDays('2026-11-01', 0), m.addDays('2026-03-08', 1)])))`;
	const results = {};
	for (const tz of ['America/New_York', 'Asia/Tokyo', 'Pacific/Auckland', 'UTC']) {
		const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, TZ: tz }, encoding: 'utf8' });
		results[tz] = r.stdout.trim();
	}
	const want = JSON.stringify(['2026-04-03', '2026-11-03', '2026-11-01', '2026-03-09']);
	return Object.values(results).every((r) => r === want) || results;
});
await c.check('regression: invalid amounts still throw', () => {
	const bad = ['ten', '1.234', '', '1.2.3', '$5', '5-'].filter((t) => {
		try {
			parseAmount(t);
			return true;
		} catch {
			return false;
		}
	});
	return bad.length === 0 || { accepted: bad };
});
await c.check('regression: positive amounts and currencies', () => {
	let threw = false;
	try {
		formatAmount(100, 'JPY');
	} catch {
		threw = true;
	}
	const got = [formatAmount(123456), formatAmount(5), formatAmount(1000, 'EUR'), formatAmount(99, 'GBP'), formatAmount(100000000)];
	return (same(got, ['$1,234.56', '$0.05', '€10.00', '£0.99', '$1,000,000.00']) && threw) || { got, threw };
});
await c.check('regression: tax rates and rounding', () => {
	const got = [RATES.SK, RATES.CZ, RATES.DE, RATES.AT, RATES.PL, RATES.US, taxFor(1005, 'SK'), taxFor(250, 'AT'), taxFor(1000, 'US')];
	let threw = false;
	try {
		taxFor(100, 'XX');
	} catch {
		threw = true;
	}
	return (same(got, [0.23, 0.21, 0.19, 0.2, 0.23, 0, 231, 50, 0]) && threw) || { got, threw };
});
await c.check('regression: invoices, coupons and due dates', () => {
	const lines = [line('Widget', 3, '10.00'), line('Gadget', 2, '2.50')];
	const plain = createInvoice({ ...base, issueDate: '2026-01-10', lines });
	const expired = createInvoice({ ...base, issueDate: '2026-01-10', lines, coupon: { code: 'OLD', percent: 50, validFrom: '2025-01-01', validUntil: '2025-12-31' } });
	const big = createInvoice({ ...base, country: 'US', issueDate: '2026-01-10', netDays: 30, lines, coupon: { code: 'BIG', amount: 99999, validFrom: '2026-01-01', validUntil: '2026-01-31' } });
	const got = [plain.subtotal, plain.tax, plain.total, plain.dueDate, expired.discount, expired.total, big.discount, big.total, big.dueDate, discountFor(333, { percent: 50 }), plain.items[0].unitCents, plain.items[0].totalCents, plain.number, plain.customer];
	return same(got, [3500, 805, 4305, '2026-01-24', 0, 4305, 3500, 0, '2026-02-09', 167, 1000, 3000, 'T-1', 'Test']) || { got };
});
await c.check('regression: the public API is unchanged', () => {
	const names = Object.keys(lib).sort();
	const want = ['RATES', 'addDays', 'createInvoice', 'discountFor', 'formatAmount', 'isCouponValid', 'parseAmount', 'taxFor', 'toCsv'];
	return same(names, want) || { names };
});

// Their own test suite, for the write-up; not scored.
const own = spawnSync('npm test', { cwd: workspace, shell: true, encoding: 'utf8', timeout: 120000 });
const count = (label) => Number((own.stdout.match(new RegExp(`ℹ ${label} (\\d+)`)) ?? [])[1] ?? NaN);
const summary = { ...c.summary(), ownTests: { pass: count('pass'), fail: count('fail') } };
writeFileSync(join(out, 'result.json'), JSON.stringify(summary, null, 2));
console.log(`X1: ${summary.passed}/${summary.total} (their tests: ${summary.ownTests.pass} pass, ${summary.ownTests.fail} fail)`);
