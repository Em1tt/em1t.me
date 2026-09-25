import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isCouponValid } from '../src/discounts.js';

test('a coupon is valid from its first to its last day, both included', () => {
	const summer = { code: 'SUMMER', percent: 10, validFrom: '2026-06-01', validUntil: '2026-06-30' };
	assert.equal(isCouponValid(summer, '2026-05-31'), false);
	assert.equal(isCouponValid(summer, '2026-06-01'), true);
	assert.equal(isCouponValid(summer, '2026-06-15'), true);
	assert.equal(isCouponValid(summer, '2026-06-30'), true);
	assert.equal(isCouponValid(summer, '2026-07-01'), false);
});

test('a one-day coupon is valid on that day', () => {
	const flash = { code: 'FLASH', amount: 500, validFrom: '2026-11-27', validUntil: '2026-11-27' };
	assert.equal(isCouponValid(flash, '2026-11-27'), true);
});
