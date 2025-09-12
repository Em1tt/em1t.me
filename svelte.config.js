import { mdsvex, escapeSvelte } from 'mdsvex';
import { createHighlighter } from 'shiki/bundle-full.mjs';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import remarkToc from 'remark-toc';
import rehypeKatexSvelte from 'rehype-katex-svelte';
import remarkMath from 'remark-math';
import rehypeSlug from 'rehype-slug';
import { addCopyButton, addFilename } from 'shiki-filename-copy-transformers';
//import { createHighlighter } from "@bitmachina/highlighter";
const highlighter = await createHighlighter({
	themes: ['catppuccin-mocha'],
	langs: [
		'javascript',
		'typescript',
		'svelte',
		'html',
		'jsx',
		'css',
		'bash',
		'json',
		'yaml',
		'markdown',
		'python',
		'java',
		'cpp',
		'php',
		'sql',
		'svelte',
		'astro',
		'scss',
		'yaml',
		'xml',
		'dockerfile',
		'makefile',
		'diff',
		'plaintext',
		'text'
	]
});
const mdsvexOptions = {
	extensions: ['.md', '.svx'],
	highlight: {
		highlighter: async (code, lang = 'text', meta) => {
			const html = escapeSvelte(
				highlighter.codeToHtml(code, {
					lang,
					theme: 'catppuccin-mocha',
					transformers: [addCopyButton(), addFilename(meta ? meta : '')]
				})
			);
			return `{@html \`${html}\` }`;
		}
	},
	remarkPlugins: [[remarkToc, { tight: false, maxDepth: 3, heading: 'sections' }], remarkMath],
	rehypePlugins: [
		rehypeSlug,
		[
			rehypeKatexSvelte,
			{
				macros: {
					'\\CC': '\\mathbb{C}',
					'\\vec': '\\mathbf'
				}
			}
		]
	]
};

const config = {
	preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
	kit: { adapter: adapter() },
	extensions: ['.svelte', '.svx', '.md']
};

export default config;
