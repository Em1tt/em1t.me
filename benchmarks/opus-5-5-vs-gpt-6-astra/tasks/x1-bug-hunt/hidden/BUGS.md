Seeded bugs (see buggy-src-marked/):
1. money.parseAmount: Math.floor(parseFloat(x) * 100) loses a cent (19.99 -> 1998). Fix: exact parse / Math.round.
2. discounts.isCouponValid: validUntil exclusive. Fix: <=.
3. invoice.createInvoice: tax on the subtotal before the discount. Fix: taxFor(subtotal - discount).
4. csv.field: quotes inside quoted fields not doubled. Fix: value.replace(/"/g, '""').
5. money.formatAmount: "$-5.00". Fix: sign before the symbol.
6. invoice.createInvoice: reduce without an initial value throws on no lines. Fix: reduce(..., 0).
7. invoice.addDays: local-time setDate across DST gives the previous day. Fix: UTC arithmetic.
