import { mdsvex, escapeSvelte } from 'mdsvex';
import adapter from '@sveltejs/adapter-cloudflare';
import rehypeKatexSvelte from 'rehype-katex-svelte';
import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';
import { createHighlighter } from 'shiki';

// Code colours drawn from the site's inks, on a ground a step lighter than the page.
const em1tTheme = {
	name: 'em1t',
	type: 'dark',
	colors: { 'editor.background': '#0c0a1a', 'editor.foreground': '#cbd5e1' },
	tokenColors: [
		{
			scope: ['comment', 'punctuation.definition.comment'],
			settings: { foreground: '#6f8f63', fontStyle: 'italic' }
		},
		{
			scope: ['keyword', 'storage', 'storage.type', 'keyword.operator.new', 'keyword.control'],
			settings: { foreground: '#ff5640' }
		},
		{
			scope: ['string', 'string.template', 'punctuation.definition.string'],
			settings: { foreground: '#ffa261' }
		},
		{
			scope: ['constant.numeric', 'constant.language', 'support.constant'],
			settings: { foreground: '#ff8a3d' }
		},
		{
			scope: ['entity.name.function', 'support.function', 'meta.function-call'],
			settings: { foreground: '#f5d0a9' }
		},
		{
			scope: ['entity.name.type', 'support.type', 'support.class', 'entity.name.class'],
			settings: { foreground: '#9fd18b' }
		},
		{ scope: ['variable.parameter'], settings: { foreground: '#e2e8f0' } },
		{
			scope: ['punctuation', 'keyword.operator', 'meta.brace'],
			settings: { foreground: '#94a3b8' }
		},
		{ scope: ['entity.name.tag', 'meta.tag'], settings: { foreground: '#ff5640' } },
		{ scope: ['entity.other.attribute-name'], settings: { foreground: '#ffa261' } }
	]
};

const langs = [
	'javascript',
	'typescript',
	'svelte',
	'html',
	'css',
	'bash',
	'json',
	'python',
	'jsx',
	'tsx'
];
const highlighter = await createHighlighter({ themes: [em1tTheme], langs });

// Fences can use the short names too: ```ts, ```js, ```py.
const aliases = { ts: 'typescript', js: 'javascript', py: 'python', sh: 'bash', shell: 'bash' };
// Shown in a code block's header when it has no file name.
const labels = {
	javascript: 'JavaScript',
	typescript: 'TypeScript',
	python: 'Python',
	svelte: 'Svelte',
	html: 'HTML',
	css: 'CSS',
	bash: 'Shell',
	json: 'JSON',
	jsx: 'JSX',
	tsx: 'TSX',
	text: 'Text'
};

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
	extensions: ['.svx', '.md'],
	remarkPlugins: [remarkMath],
	rehypePlugins: [rehypeSlug, rehypeKatexSvelte],
	highlight: {
		// ```ts HelloWorld.ts → highlighted code under a header with the file name (or the
		// language) and a Copy button. The button works through copyCode in src/lib/copyCode.ts.
		highlighter: async (code, lang = 'text', meta) => {
			const name = aliases[lang] ?? lang;
			const language = langs.includes(name) ? name : 'text';
			const html = highlighter.codeToHtml(code, { lang: language, theme: 'em1t' });
			const head = `<figcaption class="code-head"><span class="code-file">${meta || labels[language]}</span><button type="button" class="code-copy">Copy</button></figcaption>`;
			return `{@html \`${escapeSvelte(`<figure class="code" data-lang="${language}">${head}${html}</figure>`)}\`}`;
		}
	}
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	preprocess: [mdsvex(mdsvexOptions)],
	extensions: ['.svelte', '.svx', '.md'],

	kit: {
		adapter: adapter()
	}
};

export default config;
