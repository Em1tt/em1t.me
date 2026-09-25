// Money is always handled as a whole number of cents, never as a float.

const SYMBOLS = { USD: '$', EUR: '€', GBP: '£' };

/** Parses an amount such as "19.99", "1,234.50" or "-5" into cents. */
export function parseAmount(text) {
	const cleaned = String(text).replace(/,/g, '').trim();
	const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
	if (!match) throw new Error(`Invalid amount: ${text}`);
	// Build the cents from the digits: as a float, 19.99 * 100 is 1998.9999999999998.
	const [, sign, whole, fraction = ''] = match;
	const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
	return sign && cents ? -cents : cents; // "-0.00" is 0, not -0
}

/** Formats cents as money, e.g. 123456 → "$1,234.56", -500 → "-$5.00". */
export function formatAmount(cents, currency = 'USD') {
	const symbol = SYMBOLS[currency];
	if (!symbol) throw new Error(`Unknown currency: ${currency}`);
	const sign = cents < 0 ? '-' : '';
	const abs = Math.abs(cents);
	const whole = Math.floor(abs / 100).toLocaleString('en-US');
	const fraction = String(abs % 100).padStart(2, '0');
	return `${sign}${symbol}${whole}.${fraction}`;
}
