// The two contestants in the Opus 5.5 vs GPT-6 Astra post, and the colour each one wears in its
// charts, screenshots and verdicts. The pair passes the dataviz checks (colour-blind separation,
// lightness band, 3:1 contrast) on the page's #05030f; text never wears these colours.
export const MODELS = {
	opus: { name: 'Opus 5.5', color: '#d95926' },
	astra: { name: 'GPT-6 Astra', color: '#3987e5' }
} as const;

export type Model = keyof typeof MODELS;

/** 45.4 → '45 min', 5.5 → '5.5 min', 2 → '2 min'. */
export function minutes(value: number) {
	const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
	return `${rounded} min`;
}
