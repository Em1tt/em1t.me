import { mdsvex, escapeSvelte } from 'mdsvex';
import { createHighlighter } from 'shiki/bundle-full.mjs';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import { addCopyButton, addFilename } from 'shiki-filename-copy-transformers';
//import { createHighlighter } from "@bitmachina/highlighter";

const mdsvexOptions = {
    extensions: ['.md', '.svx'],
    highlight: {
        highlighter: async (code, lang = 'text', meta) => {
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
    remarkPlugins: [[remarkToc, { tight: false, maxDepth: 3, heading: 'sections' }]],
    rehypePlugins: [rehypeSlug],
};

const config = {
    preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
    kit: { adapter: adapter() },
    extensions: ['.svelte', '.svx', '.md']
};

export default config;
