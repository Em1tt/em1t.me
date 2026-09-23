// Posts live in src/content/posts/*.svx. Their frontmatter becomes PostMeta.
export type PostMeta = {
	slug: string;
	title: string;
	description: string;
	/** 'YYYY-MM-DD' */
	date: string;
	categories: string[];
	published: boolean;
	/** Shown next to the date, e.g. 'work in progress'. */
	status?: string;
	/** The post the home page's Writing section is built around. */
	featured?: boolean;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2025-09-11' → '11 Sep 2025', the same on the server and in every browser locale. */
export function formatDate(iso: string) {
	const [year, month, day] = iso.split('-').map(Number);
	return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** 'Collision detection for beginners (with TypeScript examples)' → ['Collision…beginners', '(with TypeScript examples)'] */
export function splitTitle(title: string): [string, string] {
	const i = title.lastIndexOf(' (');
	return i > 0 && title.endsWith(')') ? [title.slice(0, i), title.slice(i + 1)] : [title, ''];
}
