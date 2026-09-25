// Coupons: { code, percent } or { code, amount: cents }, valid from validFrom to validUntil,
// both dates included ('YYYY-MM-DD').

export function isCouponValid(coupon, date) {
	return date >= coupon.validFrom && date < coupon.validUntil; // BUG 2
}

/** How much a coupon takes off a subtotal, in cents. Never more than the subtotal. */
export function discountFor(subtotal, coupon) {
	if (coupon.percent !== undefined) return Math.round((subtotal * coupon.percent) / 100);
	return Math.min(coupon.amount, subtotal);
}
