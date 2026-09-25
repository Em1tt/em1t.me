// Hidden tests for F3, the Tidepool landing page. Run: node test.mjs <workspace> <out-dir>
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { serve, browser, checks, same, sleep, PAGE_HELPERS } from '../../../tools/harness.mjs';

const [, , workspace, out] = process.argv;
mkdirSync(out, { recursive: true });
const dist = join(workspace, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
	writeFileSync(join(out, 'result.json'), JSON.stringify({ passed: 0, total: 16, results: [], note: 'no dist/index.html' }, null, 2));
	process.exit(0);
}
const AXE = readFileSync(new URL('../../../tools/node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

// A link's words as a reader gets them: decorations marked aria-hidden (arrows, icons) don't count.
const LABEL = `
window.__label = (el) => {
	if (!el) return null;
	const copy = el.cloneNode(true);
	copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
	return copy.textContent.replace(/\\s+/g, ' ').trim();
};
true;`;

// Shown means on screen: laid out, inside the viewport, and not hidden or fully transparent.
const SHOWN = `
window.__shown = (el) => {
	if (!el || !__visible(el)) return false;
	const r = el.getBoundingClientRect();
	if (r.width < 1 || r.height < 1 || r.right <= 0 || r.left >= innerWidth) return false;
	for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
		const s = getComputedStyle(n);
		if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
		if (n.hidden || n.getAttribute('aria-hidden') === 'true' || n.inert) return false;
	}
	return true;
};
true;`;

const site = await serve(dist);
const tab = await browser();
const c = checks();
const open = async () => {
	await tab.go(site.url + '/');
	await tab.ev(PAGE_HELPERS);
	await tab.ev(SHOWN);
	await tab.ev(LABEL);
};
const nav = (href) => `[...document.querySelectorAll('a[href="${href}"]')].find((a) => a.closest('header, nav'))`;
const prices = () => tab.ev(`['free', 'family', 'plus'].map((p) => document.querySelector('[data-testid="price-' + p + '"]')?.textContent.replace(/\\s+/g, '').trim())`);
const toggleState = () => tab.ev(`(() => {
	const t = document.querySelector('[data-testid="billing-toggle"]');
	return t.getAttribute('aria-checked') === 'true' || t.getAttribute('aria-pressed') === 'true' || t.checked === true;
})()`);
const axe = async () => {
	await tab.ev(AXE + '; true');
	const r = await tab.ev(`axe.run(document, { resultTypes: ['violations'] }).then((r) => r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target })))`);
	return r;
};

await tab.size(1280, 900);
await open();
writeFileSync(join(out, 'desktop.png'), await tab.screenshot(true));

await c.check('one h1 with the headline', async () => {
	const h1 = await tab.ev(`[...document.querySelectorAll('h1')].map((h) => __text(h))`);
	return same(h1, ['Groceries, sorted together.']) || { h1 };
});
await c.check('hero copy and calls to action', async () => {
	return tab.ev(`(() => {
		const text = document.body.textContent.replace(/\\s+/g, ' ');
		const pricingLink = [...document.querySelectorAll('a[href="#pricing"]')].some((a) => __label(a) === 'See pricing');
		return text.includes("Tidepool keeps one shopping list for the whole household, in sync on every phone, so nobody buys the third jar of mustard.") && text.includes('Get Tidepool free') && pricingLink;
	})()`);
});
await c.check('nav links to the three sections, which exist', async () => {
	return tab.ev(`(() => {
		const links = [['#features', 'Features'], ['#pricing', 'Pricing'], ['#faq', 'FAQ']];
		return links.every(([href, label]) => {
			const a = [...document.querySelectorAll('a[href="' + href + '"]')].find((a) => a.closest('header, nav'));
			return !!a && __label(a) === label && !!document.getElementById(href.slice(1));
		});
	})()`);
});
await c.check('features section has the three features', async () => {
	return tab.ev(`(() => {
		const s = document.getElementById('features')?.textContent.replace(/\\s+/g, ' ') ?? '';
		return ['Lists that sync instantly', 'Aisle-by-aisle order', 'Recipes to list in one tap', "Paste a recipe link and the ingredients land on the list, minus what you already have."].every((t) => s.includes(t));
	})()`);
});
await c.check('monthly prices by default, Most popular label', async () => {
	const got = await prices();
	const popular = await tab.ev(`(document.getElementById('pricing')?.textContent ?? '').includes('Most popular')`);
	return (same(got, ['$0/mo', '$4/mo', '$9/mo']) && popular) || { got, popular };
});
await c.check('billing toggle switches to yearly and back', async () => {
	const before = await toggleState();
	await tab.ev(`document.querySelector('[data-testid="billing-toggle"]').click(), true`);
	await sleep(250);
	const yearly = await prices();
	const on = await toggleState();
	await tab.ev(`document.querySelector('[data-testid="billing-toggle"]').click(), true`);
	await sleep(250);
	const back = await prices();
	const off = await toggleState();
	const got = { before, yearly, on, back, off };
	const want = { before: false, yearly: ['$0/yr', '$40/yr', '$90/yr'], on: true, back: ['$0/mo', '$4/mo', '$9/mo'], off: false };
	return same(got, want) || { got, want };
});
await c.check('toggle is labelled', async () => {
	return tab.ev(`(() => {
		const t = document.querySelector('[data-testid="billing-toggle"]');
		const name = [t.getAttribute('aria-label'), t.labels?.[0]?.textContent, t.getAttribute('aria-labelledby') && document.getElementById(t.getAttribute('aria-labelledby'))?.textContent, t.textContent, t.closest('label')?.textContent].filter(Boolean).join(' ');
		return /Bill yearly/.test(name) || (document.getElementById('pricing')?.textContent ?? '').includes('Bill yearly (2 months free)');
	})()`);
});
await c.check('FAQ: four questions, all collapsed', async () => {
	return tab.ev(`(() => {
		const buttons = [...document.querySelectorAll('#faq button[aria-expanded]')];
		const questions = ['Does everyone need an account?', 'Does it work offline?', 'Can I cancel any time?', 'Which stores does it know?'];
		return buttons.length === 4 && questions.every((q, i) => __text(buttons[i]).includes(q)) && buttons.every((b) => b.getAttribute('aria-expanded') === 'false' && !__shown(document.getElementById(b.getAttribute('aria-controls'))));
	})()`);
});
await c.check('FAQ: a question opens and closes its answer', async () => {
	const step = async () =>
		tab.ev(`(() => {
			const b = [...document.querySelectorAll('#faq button[aria-expanded]')][1];
			const panel = document.getElementById(b.getAttribute('aria-controls'));
			return { expanded: b.getAttribute('aria-expanded'), shown: __shown(panel), text: panel?.textContent.includes("Changes made offline sync as soon as you're back online.") };
		})()`);
	await tab.ev(`document.getElementById('faq').scrollIntoView(), true`);
	await tab.ev(`[...document.querySelectorAll('#faq button[aria-expanded]')][1].click(), true`);
	await sleep(500);
	await tab.ev(`document.getElementById('faq').scrollIntoView(), true`);
	await sleep(200);
	const open1 = await step();
	await tab.ev(`[...document.querySelectorAll('#faq button[aria-expanded]')][1].click(), true`);
	await sleep(500);
	const closed = await step();
	const got = { open1, closed };
	return (open1.expanded === 'true' && open1.shown && open1.text && closed.expanded === 'false' && !closed.shown) || got;
});
await c.check('desktop: nav links shown, menu button not', async () => {
	await tab.ev('scrollTo(0, 0), true');
	await sleep(200);
	return tab.ev(`['#features', '#pricing', '#faq'].every((h) => __shown([...document.querySelectorAll('a[href="' + h + '"]')].find((a) => a.closest('header, nav')))) && !__shown(document.querySelector('[data-testid="menu-button"]'))`);
});
await c.check('footer', async () => {
	return tab.ev(`(() => {
		const f = document.querySelector('footer');
		const t = f?.textContent.replace(/\\s+/g, ' ') ?? '';
		return t.includes('© 2026 Tidepool') && ['Privacy', 'Terms', 'Contact'].every((l) => [...f.querySelectorAll('a')].some((a) => __label(a) === l));
	})()`);
});
await c.check('no requests to other servers', async () => {
	const outside = tab.requests.filter((u) => !u.startsWith(site.url) && !u.startsWith('data:') && !u.startsWith('blob:') && !u.startsWith('about:'));
	return outside.length === 0 || { outside: outside.slice(0, 5) };
});
await c.check('axe: no serious or critical violations at 1280 px', async () => {
	await open();
	const v = await axe();
	return v.length === 0 || { violations: v };
});
await c.check('mobile: links hidden until the menu button opens them', async () => {
	await tab.size(390, 844);
	await open();
	writeFileSync(join(out, 'mobile.png'), await tab.screenshot(true));
	const links = `['#features', '#pricing', '#faq'].map((h) => __shown([...document.querySelectorAll('a[href="' + h + '"]')].find((a) => a.closest('header, nav'))))`;
	const before = await tab.ev(links);
	const button = await tab.ev(`(() => { const b = document.querySelector('[data-testid="menu-button"]'); return { shown: __shown(b), expanded: b?.getAttribute('aria-expanded') }; })()`);
	await tab.ev(`document.querySelector('[data-testid="menu-button"]').click(), true`);
	await sleep(500);
	const after = await tab.ev(links);
	const expanded = await tab.ev(`document.querySelector('[data-testid="menu-button"]').getAttribute('aria-expanded')`);
	const got = { before, button, after, expanded };
	return (before.every((x) => !x) && button.shown && button.expanded === 'false' && after.every(Boolean) && expanded === 'true') || got;
});
await c.check('axe: no serious or critical violations at 390 px', async () => {
	await open();
	const v = await axe();
	return v.length === 0 || { violations: v };
});
await c.check('no sideways scroll at 360, 768 and 1280 px', async () => {
	const got = {};
	for (const w of [360, 768, 1280]) {
		await tab.size(w, 900);
		await open();
		got[w] = await tab.ev('document.documentElement.scrollWidth - innerWidth');
	}
	return Object.values(got).every((x) => x <= 0) || got;
});

const summary = { ...c.summary(), pageErrors: tab.errors.slice(0, 10) };
tab.close();
site.close();
writeFileSync(join(out, 'result.json'), JSON.stringify(summary, null, 2));
console.log(`F3: ${summary.passed}/${summary.total}`);
