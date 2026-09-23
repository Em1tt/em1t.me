import { contactLinks } from '$lib/contact';

/** Site-wide facts for titles, social cards and structured data. */
export const SITE = {
	url: 'https://em1t.me',
	name: 'em1t.me',
	author: 'Richard Marcinčák',
	jobTitle: 'Full-stack developer and designer',
	locale: 'en_US',
	/** 1200×630 cards made by `npm run og` (scripts/og-cards.mjs). */
	image: '/og/default.jpg',
	imageAlt: 'Richard Marcinčák, full-stack developer and designer, on dithered red botanical art',
	/** Profiles that are also you, for search engines. */
	sameAs: contactLinks.map((link) => link.href).filter((href) => href.startsWith('https://'))
};
