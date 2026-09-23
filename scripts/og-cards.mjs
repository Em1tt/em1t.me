// Makes the 1200×630 social cards in static/og/ by screenshotting HTML in Chrome, so they use the
// site's own fonts, strips and art. Run it after adding a post or case study: npm run og
// Needs Chrome; set CHROME=/path/to/chrome if it isn't found. Pages whose card is missing fall
// back to static/og/default.jpg (see src/routes/og/[...path]/+server.ts).
import { spawn } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { formatDate, splitTitle } from '../src/lib/posts.ts';
import { caseStudies } from '../src/lib/projects.ts';

const ROOT = resolve(import.meta.dirname, '..');
const STATIC = join(ROOT, 'static');
const PORT = 9357;
// Dithered art is all fine detail; this keeps the art cards under WhatsApp's ~300 KB preview limit.
const QUALITY = 74;
const CHROMES = [
	process.env.CHROME,
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	'/usr/bin/google-chrome',
	'/usr/bin/chromium'
];

const escape = (text) =>
	String(text).replace(
		/[&<>"]/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
	);
const file = (path) => pathToFileURL(join(STATIC, path)).href;

/** Frontmatter fields the cards need, read without a YAML parser. */
function frontmatter(path) {
	const block = readFileSync(path, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
	const field = (key) =>
		block
			.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))?.[1]
			.trim()
			.replace(/^['"]|['"]$/g, '');
	return { title: field('title'), date: field('date'), published: field('published') === 'true' };
}

/** A card: art behind, the E1 mark and site name on top, dark and red text strips at the bottom. */
function card({ art, position = 'center', label, title, accent, sub }) {
	const size = title.length <= 18 ? 96 : title.length <= 34 ? 76 : 60;
	return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400..700&family=Google+Sans+Code:wght@400..600&display=block" rel="stylesheet">
<style>
	* { box-sizing: border-box; }
	html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #05030f; }
	.art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: ${position}; }
	.top { position: absolute; top: 48px; left: 56px; display: flex; align-items: center; gap: 12px; background: #05030f; padding: 10px 16px 10px 12px; }
	.top img { width: 40px; height: 40px; }
	.mono { font-family: 'Google Sans Code', monospace; }
	.site { color: #cbd5e1; font-size: 22px; letter-spacing: 0.08em; }
	.chip { background: #05030f; color: #cbd5e1; padding: 0.6em 0.8em; font-size: 20px; line-height: 1; letter-spacing: 0.08em; }
	.bottom { position: absolute; left: 56px; right: 56px; bottom: 56px; display: flex; flex-direction: column; align-items: flex-start; gap: 20px; }
	.label { color: #94a3b8; text-transform: uppercase; font-size: 18px; }
	h1 { margin: 0; max-width: 960px; font: 500 ${size}px/1.16 'Google Sans', sans-serif; letter-spacing: -0.03em; color: #f1f5f9; }
	h1 span, p span { box-decoration-break: clone; -webkit-box-decoration-break: clone; }
	h1 span { background: #05030f; padding: 0 0.14em 0.04em; }
	h1 .accent { background: #a91a06; color: #fff; }
	p { margin: 0; max-width: 860px; font: 400 28px/1.8 'Google Sans', sans-serif; color: #e2e8f0; }
	p span { background: #05030f; padding: 0.16em 0.42em; }
	p.accent span { background: #a91a06; color: #fff; }
</style></head><body>
<img class="art" src="${art}" alt="">
<div class="top"><img src="${file('E1.svg')}" alt=""><span class="mono site">em1t.me</span></div>
<div class="bottom">
	<span class="chip mono label">${escape(label)}</span>
	<h1><span>${escape(title)}</span>${accent ? ` <span class="accent">${escape(accent)}</span>` : ''}</h1>
	${sub ? `<p class="${sub.red ? 'accent' : ''}"><span>${escape(sub.text)}</span></p>` : ''}
</div>
</body></html>`;
}

const posts = readdirSync(join(ROOT, 'src/content/posts'))
	.filter((name) => name.endsWith('.svx'))
	.map((name) => ({
		slug: name.replace('.svx', ''),
		...frontmatter(join(ROOT, 'src/content/posts', name))
	}))
	.filter((post) => post.published);

// Posts split like on the site: '(…)' suffixes, or else after a colon, go on the red strip.
function postTitle(title) {
	const [main, tail] = splitTitle(title);
	if (tail) return [main, tail];
	const colon = title.indexOf(': ');
	return colon > 0 ? [title.slice(0, colon + 1), title.slice(colon + 2)] : [title, ''];
}

const cards = [
	{
		out: 'og/default.jpg',
		art: file('img2.png'),
		label: '[Full-stack developer / designer]',
		title: 'Richard Marcinčák',
		sub: { text: 'I design and build for the web, then try to break it.', red: true }
	},
	{
		out: 'og/blog.jpg',
		art: file('bg4.png'),
		label: '[Blog]',
		title: 'Blog',
		sub: { text: 'The maths behind games, and CTF challenges with their solutions.' }
	},
	...posts.map((post) => {
		const [title, accent] = postTitle(post.title);
		return {
			out: `og/blog/${post.slug}.jpg`,
			art: file('bg4.png'),
			label: `[Blog] · ${formatDate(post.date)}`,
			title,
			accent
		};
	}),
	...caseStudies.map((project, i) => ({
		out: `og/work/${project.slug}.jpg`,
		art: file(project.cover.replace(/^\//, '')),
		position: 'right center',
		label: `[Case study · ${i + 1} of ${caseStudies.length}]`,
		title: project.name,
		sub: { text: project.type }
	}))
];

const chromePath = CHROMES.find((path) => path && existsSync(path));
if (!chromePath) throw new Error('Chrome not found. Set CHROME=/path/to/chrome.');
const profile = mkdtempSync(join(tmpdir(), 'og-cards-'));
const chrome = spawn(
	chromePath,
	[
		'--headless=new',
		`--remote-debugging-port=${PORT}`,
		'--hide-scrollbars',
		`--user-data-dir=${profile}`,
		'about:blank'
	],
	{ stdio: 'ignore' }
);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

try {
	let target;
	for (let i = 0; i < 80 && !target; i++) {
		target = await fetch(`http://127.0.0.1:${PORT}/json/list`)
			.then((response) => response.json())
			.then((list) => list.find((entry) => entry.type === 'page'))
			.catch(() => sleep(250));
	}
	if (!target) throw new Error('Chrome did not start.');

	const socket = new WebSocket(target.webSocketDebuggerUrl);
	await new Promise((done) => (socket.onopen = done));
	let id = 0;
	const waiting = new Map();
	socket.onmessage = ({ data }) => {
		const message = JSON.parse(data);
		waiting.get(message.id)?.(message);
		waiting.delete(message.id);
	};
	const send = (method, params = {}) =>
		new Promise((done) => {
			waiting.set(++id, done);
			socket.send(JSON.stringify({ id, method, params }));
		});

	await send('Page.enable');
	await send('Emulation.setDeviceMetricsOverride', {
		width: 1200,
		height: 630,
		deviceScaleFactor: 1,
		mobile: false
	});
	const page = join(profile, 'card.html');

	for (const { out, ...options } of cards) {
		writeFileSync(page, card(options));
		await send('Page.navigate', { url: pathToFileURL(page).href });
		await send('Runtime.evaluate', {
			expression: `(async () => {
				await new Promise((done) => (document.readyState === 'complete' ? done() : addEventListener('load', done)));
				await document.fonts.ready;
				await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
			})()`,
			awaitPromise: true
		});
		const shot = await send('Page.captureScreenshot', {
			format: 'jpeg',
			quality: QUALITY,
			clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 }
		});
		const target = join(STATIC, out);
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(target, Buffer.from(shot.result.data, 'base64'));
		console.log(`${out}  ${Math.round(Buffer.byteLength(shot.result.data, 'base64') / 1024)} KB`);
	}
	socket.close();
} finally {
	chrome.kill();
}
