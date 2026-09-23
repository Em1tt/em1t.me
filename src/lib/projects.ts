export type Project = {
	slug: string;
	name: string;
	/** What it is, in a few words. */
	type: string;
	/** One sentence, used on the case study hero. */
	summary: string;
	/** Short tag for the "Also" line under the plates. */
	short: string;
	/** Cover image (logo on a dark plate), shown on the Work plates. */
	cover?: string;
	/** Transparent logo and brand colour for the case study header. */
	logo?: string;
	brand?: string;
	years?: string;
	/** Case studies get a plate and a page at /work/[slug], with the body in src/content/work/[slug].svx. */
	caseStudy: boolean;
	/** The project being worked on now: its plate gets a "Now" tag. */
	current?: boolean;
	/** Where the "Also" line links to, for projects without a case study. */
	href?: string;
	/** Facts for the case study rail; anything missing shows as TK until you fill it in. */
	facts?: { role?: string; year?: string; stack?: string; team?: string; link?: string };
};

export const projects: Project[] = [
	{
		slug: 'hallify',
		name: 'Hallify',
		type: 'Venue booking platform',
		summary:
			'Reservations for social halls, with an editor for the room itself. Rebuilt in 2026 as a platform for any venue.',
		short: 'rebuilt in 2026',
		cover: '/covers/hallify.webp',
		logo: '/logos/hallify.png',
		brand: '#f05ca1',
		years: '2023–',
		caseStudy: true,
		current: true,
		facts: {
			role: 'Design & full stack',
			year: '2023–2025, rebuilt 2026',
			stack: 'SvelteKit, Svelte 5, Cloudflare Workers, D1, R2, Stripe',
			link: 'https://hallify.sk'
		}
	},
	{
		slug: 'pumplo',
		name: 'Pumplo',
		type: 'Gym app · design language & MVP',
		summary: 'A gym app, live in Olomouc. I worked on its design language, first site and app MVP.',
		short: 'gym app',
		cover: '/covers/pumplo.webp',
		logo: '/logos/pumplo.png',
		brand: '#45b8f5',
		years: '2025–2026',
		caseStudy: true,
		facts: {
			role: 'Design language, UI/UX & front end',
			year: 'September 2025 – around May 2026',
			stack: 'First site: SvelteKit, Prisma, PostgreSQL',
			team: 'App MVP: five people',
			link: 'https://pumplo.com'
		}
	},
	{
		slug: 'boostly',
		name: 'Boostly.sk',
		type: 'Social & print graphics',
		summary:
			'Three months of graphics for a Slovak social media agency: its own Instagram, and a banner for one of its clients.',
		short: 'graphics, 3 months',
		cover: '/covers/boostly.webp',
		logo: '/logos/boostly.png',
		brand: '#2749ff',
		years: '2025–26',
		caseStudy: true,
		facts: {
			role: 'Freelance graphic designer',
			year: '2025–26, three months',
			stack: 'Illustrator, Affinity',
			team: 'Tomáš and Marek Bekeš, Boostly'
		}
	},
	{
		slug: 'tatrapak',
		name: 'Tatrapak',
		type: 'Production order system',
		summary: "An information system that took Tatrapak's production orders off paper.",
		short: 'order system',
		cover: '/covers/tatrapak.webp',
		logo: '/logos/tatrapak.png',
		brand: '#2ba52b',
		years: '2024',
		caseStudy: true,
		facts: {
			role: 'Design & full stack',
			year: 'November 2024, three weeks',
			stack: 'SvelteKit, Svelte 5, MySQL, Sequelize',
			team: 'Solo · promo site with Marko Kušnirák',
			link: 'https://github.com/Em1tt/tatrapak-portal'
		}
	},
	{
		slug: 'ametrine',
		name: 'Ametrine.host',
		type: 'Hosting startup, built before ChatGPT',
		summary:
			'A hosting company I set out to start in 2021 and built by hand, before ChatGPT existed. It never launched.',
		short: 'hosting company',
		cover: '/covers/ametrine.webp',
		logo: '/logos/ametrine.png',
		brand: '#be50d2',
		years: '2021–2022',
		caseStudy: true,
		facts: {
			role: 'Founder · front end, parts of the back end',
			year: '2021–2022',
			stack: 'Node, TypeScript, Express, Eta, Redis, Stripe',
			team: 'Three: with b1tt0 and FireMario211',
			link: 'https://github.com/Em1tt/ametrine.host'
		}
	},
	{
		slug: 'the-chosen-few',
		name: 'The Chosen Few',
		type: 'CLI rogue-like card game',
		summary: 'Meant to be a tiny game. Became 30+ cards, 3 currencies and 5+ hours of play.',
		short: 'CLI card game',
		caseStudy: false
	},
	{
		slug: 'ssosta-chat',
		name: 'ssosta.chat',
		type: 'Real-time chat',
		summary: 'Real-time chat where every message goes out under a random Adjective+Animal name.',
		short: 'anonymous chat',
		years: '2023',
		caseStudy: false,
		href: 'https://github.com/Em1tt/ssosta.chat'
	},
	{
		slug: 'lifespan',
		name: 'Lifespan',
		type: 'One-page site',
		summary: 'How far through an average Slovak lifespan I am, live, to fourteen decimal places.',
		short: '20th-birthday project',
		years: '2025',
		caseStudy: false,
		href: 'https://github.com/Em1tt/Lifespan'
	},
	{
		slug: 'video-generator',
		name: 'Video-Generator',
		type: 'Command-line tool',
		summary: "Pulls a subreddit's top videos and cuts them into one compilation with FFmpeg.",
		short: 'Reddit → FFmpeg',
		years: '2023',
		caseStudy: false,
		href: 'https://github.com/Em1tt/Video-Generator'
	},
	{
		slug: 'terapias-de-priscos',
		name: 'Terapias de Priscos',
		type: 'Front-end developer, Erasmus+',
		summary: 'Front-end work in Portugal through Erasmus+, on WordPress.',
		short: 'Erasmus+ 2024',
		years: '2024',
		caseStudy: false,
		href: 'https://terapiasdepriscos.pt/'
	}
];

export const caseStudies = projects.filter((project) => project.caseStudy);
