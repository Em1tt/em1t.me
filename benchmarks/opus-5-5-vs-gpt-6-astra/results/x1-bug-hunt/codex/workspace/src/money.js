// Money is always handled as a whole number of cents, never as a float.

const SYMBOLS = { USD: '$', EUR: '€', GBP: '£' };

/** Parses an amount such as "19.99", "1,234.50" or "-5" into cents. */
export function parseAmount(text) {
	const cleaned = String(text).replace(/,/g, '').trim();
	if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) throw new Error(`Invalid amount: ${text}`);
	const [whole, fraction = ''] = cleaned.split('.');
	return Number(`${whole}${fraction.padEnd(2, '0')}`);
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
