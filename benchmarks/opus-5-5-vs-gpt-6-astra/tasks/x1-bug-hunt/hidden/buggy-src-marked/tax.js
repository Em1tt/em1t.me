// VAT and sales tax rates by country.

export const RATES = { SK: 0.23, CZ: 0.21, DE: 0.19, AT: 0.2, PL: 0.23, US: 0 };

/** The tax on an amount in cents, rounded to the nearest cent. */
export function taxFor(cents, country) {
	const rate = RATES[country];
	if (rate === undefined) throw new Error(`Unknown country: ${country}`);
	return Math.round(cents * rate);
}
