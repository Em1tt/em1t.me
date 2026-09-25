import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isCouponValid } from '../src/index.js';

const coupon = {
	code: 'SUMMER',
	percent: 10,
	validFrom: '2026-06-01',
	validUntil: '2026-06-30'
};

test('coupon validity includes both boundary dates', () => {
	assert.equal(isCouponValid(coupon, '2026-05-31'), false);
	assert.equal(isCouponValid(coupon, '2026-06-01'), true);
	assert.equal(isCouponValid(coupon, '2026-06-15'), true);
	assert.equal(isCouponValid(coupon, '2026-06-30'), true);
	assert.equal(isCouponValid(coupon, '2026-07-01'), false);
});

test('a coupon can be valid for a single day', () => {
	const singleDayCoupon = { ...coupon, validFrom: '2026-06-30' };
	assert.equal(isCouponValid(singleDayCoupon, '2026-06-29'), false);
	assert.equal(isCouponValid(singleDayCoupon, '2026-06-30'), true);
	assert.equal(isCouponValid(singleDayCoupon, '2026-07-01'), false);
});
