# invoicing

A small library that builds invoices and exports them. Money is always a whole number of cents.

- `parseAmount(text)`: `"19.99"`, `"1,234.50"` or `"-5"` → cents. Throws on anything else.
- `formatAmount(cents, currency = 'USD')`: cents → `"$1,234.56"`; negative amounts get a leading
  minus, `"-$5.00"`. Currencies: USD, EUR, GBP.
- `RATES`, `taxFor(cents, country)`: tax rates by country, and the tax on an amount, rounded to
  the nearest cent.
- `isCouponValid(coupon, date)`, `discountFor(subtotal, coupon)`: coupons are
  `{ code, percent }` or `{ code, amount }` (cents), valid from `validFrom` to `validUntil`,
  both dates included.
- `addDays(date, days)`: `'YYYY-MM-DD'` plus some days.
- `createInvoice({ number, customer, country, issueDate, netDays = 14, lines, coupon })`: lines
  are `{ description, quantity, unitPrice }` with `unitPrice` as text. Returns the invoice with
  `items`, `subtotal`, `discount`, `tax` (charged on the subtotal after the discount), `total` and
  `dueDate`.
- `toCsv(invoice, currency = 'USD')`: the lines as RFC 4180 CSV with CRLF line endings.
