import { parseAmount } from './money.js';
import { taxFor } from './tax.js';
import { isCouponValid, discountFor } from './discounts.js';

/** 'YYYY-MM-DD' plus a number of days. */
export function addDays(date, days) {
	// 'YYYY-MM-DD' parses as midnight UTC, so count the days in UTC too. In local time, a daylight
	// saving change in between moves the result by an hour, which is onto the previous day.
	const d = new Date(date);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

/**
 * Builds an invoice. Lines are { description, quantity, unitPrice } with unitPrice as text,
 * e.g. "19.99". The coupon is optional. Tax is charged on the subtotal after the discount.
 */
export function createInvoice({ number, customer, country, issueDate, netDays = 14, lines = [], coupon }) {
	const items = lines.map((line) => {
		const unitCents = parseAmount(line.unitPrice);
		return { description: line.description, quantity: line.quantity, unitCents, totalCents: unitCents * line.quantity };
	});
	const subtotal = items.map((item) => item.totalCents).reduce((a, b) => a + b, 0);
	const discount = coupon && isCouponValid(coupon, issueDate) ? discountFor(subtotal, coupon) : 0;
	const tax = taxFor(subtotal - discount, country);
	return {
		number,
		customer,
		country,
		issueDate,
		dueDate: addDays(issueDate, netDays),
		items,
		subtotal,
		discount,
		tax,
		total: subtotal - discount + tax
	};
}
