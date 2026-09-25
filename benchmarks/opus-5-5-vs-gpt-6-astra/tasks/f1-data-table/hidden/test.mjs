// Hidden tests for F1, the employee table. Run: node test.mjs <workspace> <out-dir>
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { serve, browser, checks, same, sleep, PAGE_HELPERS } from '../../../tools/harness.mjs';

const [, , workspace, out] = process.argv;
mkdirSync(out, { recursive: true });
const data = JSON.parse(readFileSync(new URL('../template/data/employees.json', import.meta.url), 'utf8'));
const dist = join(workspace, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
	writeFileSync(join(out, 'result.json'), JSON.stringify({ passed: 0, total: 21, results: [], note: 'no dist/index.html' }, null, 2));
	process.exit(0);
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const day = (s) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const KEYS = ['name', 'email', 'department', 'role', 'salary', 'startDate', 'location'];
function view({ q = '', dept = '', sort = null, dir = 'asc' } = {}) {
	const query = q.trim().toLowerCase();
	let rows = data.filter(
		(e) =>
			(!query || ['name', 'email', 'department', 'role', 'location'].some((k) => e[k].toLowerCase().includes(query))) &&
			(!dept || e.department === dept)
	);
	if (sort) {
		const sign = dir === 'desc' ? -1 : 1;
		const cmp = (a, b) =>
			sort === 'salary' ? a.salary - b.salary : sort === 'startDate' ? a.startDate.localeCompare(b.startDate) : a[sort].localeCompare(b[sort], 'en');
		rows = [...rows].sort((a, b) => sign * cmp(a, b) || a.id - b.id);
	}
	return rows;
}
const page = (rows, n) => rows.slice((n - 1) * 20, n * 20).map((e) => e.id);
const count = (rows, n) => (rows.length ? `Showing ${(n - 1) * 20 + 1}–${Math.min(n * 20, rows.length)} of ${rows.length}` : 'Showing 0 of 0');

const site = await serve(dist);
const tab = await browser();
const c = checks();
const ids = () => tab.ev(`[...document.querySelectorAll('tbody tr')].map((tr) => Number(tr.dataset.id))`);
const text = (sel) => tab.ev(`__text(document.querySelector(${JSON.stringify(sel)}))`);
const open = async (query = '') => {
	await tab.go(site.url + '/' + query);
	await tab.ev(PAGE_HELPERS);
	await tab.until(`document.querySelectorAll('tbody tr').length > 0 || __visible(document.querySelector('[data-testid="empty"]'))`, 6000);
};
const setSearch = async (value) => {
	await tab.ev(`__set(document.querySelector('[data-testid="search"]'), ${JSON.stringify(value)}), true`);
	await sleep(700);
};
const setDept = async (value) => {
	await tab.ev(`__set(document.querySelector('[data-testid="department"]'), ${JSON.stringify(value)}), true`);
	await sleep(400);
};
const clickSort = async (key) => {
	await tab.ev(`document.querySelector('th[data-key="${key}"] button').click(), true`);
	await sleep(300);
};
const click = async (testid) => {
	await tab.ev(`document.querySelector('[data-testid="${testid}"]').click(), true`);
	await sleep(300);
};
const ariaSort = () => tab.ev(`Object.fromEntries([...document.querySelectorAll('th[data-key]')].map((th) => [th.dataset.key, th.getAttribute('aria-sort')]))`);
const params = () => tab.ev(`Object.fromEntries(new URLSearchParams(location.search))`);

await tab.size(1280, 900);
await open();
writeFileSync(join(out, 'desktop.png'), await tab.screenshot(true));

await c.check('first page: ids 1–20, count, page info, buttons', async () => {
	const all = view();
	const got = { ids: await ids(), count: await text('[data-testid="count"]'), info: await text('[data-testid="page-info"]'), prev: await tab.ev(`document.querySelector('[data-testid="prev"]').disabled`), next: await tab.ev(`document.querySelector('[data-testid="next"]').disabled`) };
	const want = { ids: page(all, 1), count: count(all, 1), info: 'Page 1 of 25', prev: true, next: false };
	return same(got, want) || { got, want };
});
await c.check('columns: th data-key order and header text', async () => {
	const got = await tab.ev(`[...document.querySelectorAll('thead th')].map((th) => [th.dataset.key, __text(th)])`);
	const want = [['name', 'Name'], ['email', 'Email'], ['department', 'Department'], ['role', 'Role'], ['salary', 'Salary'], ['startDate', 'Start date'], ['location', 'Location']];
	return same(got.map(([k, t]) => [k, t.replace(/[^\p{L} ]/gu, '').replace(/\s+/g, ' ').trim()]), want) || { got };
});
await c.check('cell formatting of the first three rows', async () => {
	const got = await tab.ev(`[...document.querySelectorAll('tbody tr')].slice(0, 3).map((tr) => [...tr.querySelectorAll('td')].map((td) => __text(td)))`);
	const want = data.slice(0, 3).map((e) => [e.name, e.email, e.department, e.role, money.format(e.salary), day(e.startDate), e.location]);
	return same(got, want) || { got, want };
});
await c.check('search is case-insensitive and trimmed', async () => {
	await setSearch('  ENGINEER ');
	const a = await ids();
	const n = await text('[data-testid="count"]');
	const rows = view({ q: 'engineer' });
	return (same(a, page(rows, 1)) && n === count(rows, 1)) || { got: [a, n], want: [page(rows, 1), count(rows, 1)] };
});
await c.check('search matches names with accents and email/location', async () => {
	const results = [];
	for (const q of ['zoë', 'são', 'o’brien', "o'brien", '@example.com']) {
		await setSearch(q);
		const rows = view({ q });
		results.push(same(await ids(), page(rows, 1)) && (await text('[data-testid="count"]')) === count(rows, 1));
	}
	await setSearch('');
	return results.every(Boolean) || { results };
});
await c.check('department options: All departments, then sorted', async () => {
	const got = await tab.ev(`[...document.querySelector('[data-testid="department"]').options].map((o) => [o.value, __text(o)])`);
	const want = [['', 'All departments'], ...[...new Set(data.map((e) => e.department))].sort().map((d) => [d, d])];
	return same(got, want) || { got, want };
});
await c.check('department filter combined with search', async () => {
	await setDept('Design');
	const d = view({ dept: 'Design' });
	const onlyDept = same(await ids(), page(d, 1)) && (await text('[data-testid="count"]')) === count(d, 1);
	await setSearch('an');
	const both = view({ q: 'an', dept: 'Design' });
	const combined = same(await ids(), page(both, 1)) && (await text('[data-testid="count"]')) === count(both, 1);
	await setSearch('');
	await setDept('');
	return (onlyDept && combined) || { onlyDept, combined };
});
await c.check('salary sort: ascending, descending, then off', async () => {
	await clickSort('salary');
	const asc = same(await ids(), page(view({ sort: 'salary' }), 1)) && (await ariaSort()).salary === 'ascending';
	await clickSort('salary');
	const desc = same(await ids(), page(view({ sort: 'salary', dir: 'desc' }), 1)) && (await ariaSort()).salary === 'descending';
	await clickSort('salary');
	const off = same(await ids(), page(view(), 1)) && (await ariaSort()).salary === 'none';
	return (asc && desc && off) || { asc, desc, off };
});
await c.check('name sort uses localeCompare, ties by id', async () => {
	await clickSort('name');
	const rows = view({ sort: 'name' });
	const first = same(await ids(), page(rows, 1));
	await click('next');
	const second = same(await ids(), page(rows, 2));
	await clickSort('name');
	await clickSort('name');
	return (first && second) || { first, second };
});
await c.check('start date sort descending', async () => {
	await clickSort('startDate');
	await clickSort('startDate');
	const ok = same(await ids(), page(view({ sort: 'startDate', dir: 'desc' }), 1));
	await clickSort('startDate');
	return ok;
});
await c.check('one sorted column at a time; aria-sort none elsewhere', async () => {
	await clickSort('name');
	await clickSort('salary');
	const aria = await ariaSort();
	const want = Object.fromEntries(KEYS.map((k) => [k, k === 'salary' ? 'ascending' : 'none']));
	const rowsOk = same(await ids(), page(view({ sort: 'salary' }), 1));
	await clickSort('salary');
	await clickSort('salary');
	return (same(aria, want) && rowsOk) || { aria, rowsOk };
});
await c.check('pagination: next, prev, last page, disabled states', async () => {
	await click('next');
	await click('next');
	const p3 = same(await ids(), page(view(), 3)) && (await text('[data-testid="count"]')) === 'Showing 41–60 of 500' && (await text('[data-testid="page-info"]')) === 'Page 3 of 25';
	await click('prev');
	const p2 = same(await ids(), page(view(), 2));
	for (let i = 0; i < 30; i++) {
		if (await tab.ev(`document.querySelector('[data-testid="next"]').disabled`)) break;
		await tab.ev(`document.querySelector('[data-testid="next"]').click()`);
		await sleep(60);
	}
	await sleep(200);
	const last = same(await ids(), page(view(), 25)) && (await text('[data-testid="count"]')) === 'Showing 481–500 of 500' && (await tab.ev(`document.querySelector('[data-testid="next"]').disabled`)) && !(await tab.ev(`document.querySelector('[data-testid="prev"]').disabled`));
	return (p3 && p2 && last) || { p3, p2, last };
});
await c.check('sorting and searching go back to page 1', async () => {
	await open();
	await click('next');
	await click('next');
	await clickSort('role');
	const sorted = (await text('[data-testid="page-info"]')).startsWith('Page 1 of') && same(await ids(), page(view({ sort: 'role' }), 1));
	await click('next');
	await setSearch('a');
	const searched = (await text('[data-testid="page-info"]')).startsWith('Page 1 of');
	return (sorted && searched) || { sorted, searched };
});
await c.check('empty state', async () => {
	await open();
	await setSearch('zzzzqqq');
	const got = {
		rows: (await ids()).length,
		empty: await tab.ev(`__visible(document.querySelector('[data-testid="empty"]')) && __text(document.querySelector('[data-testid="empty"]'))`),
		count: await text('[data-testid="count"]'),
		info: await text('[data-testid="page-info"]'),
		prev: await tab.ev(`document.querySelector('[data-testid="prev"]').disabled`),
		next: await tab.ev(`document.querySelector('[data-testid="next"]').disabled`)
	};
	const want = { rows: 0, empty: 'No employees match your filters.', count: 'Showing 0 of 0', info: 'Page 1 of 1', prev: true, next: true };
	return same(got, want) || { got, want };
});
await c.check('empty element hidden when there are results', async () => {
	await setSearch('');
	return !(await tab.ev(`__visible(document.querySelector('[data-testid="empty"]'))`));
});
await c.check('URL reflects the state', async () => {
	await open();
	await setSearch('an');
	await setDept('Engineering');
	await clickSort('salary');
	await clickSort('salary');
	await click('next');
	const got = await params();
	const want = { q: 'an', dept: 'Engineering', sort: 'salary', dir: 'desc', page: '2' };
	return same(Object.fromEntries(Object.entries(got).sort()), Object.fromEntries(Object.entries(want).sort())) || { got, want };
});
await c.check('URL restores the state on load', async () => {
	await open('?q=an&dept=Engineering&sort=salary&dir=desc&page=2');
	const rows = view({ q: 'an', dept: 'Engineering', sort: 'salary', dir: 'desc' });
	const got = {
		ids: await ids(),
		q: await tab.ev(`document.querySelector('[data-testid="search"]').value`),
		dept: await tab.ev(`document.querySelector('[data-testid="department"]').value`),
		aria: (await ariaSort()).salary,
		count: await text('[data-testid="count"]')
	};
	const want = { ids: page(rows, 2), q: 'an', dept: 'Engineering', aria: 'descending', count: count(rows, 2) };
	return same(got, want) || { got, want };
});
await c.check('default view has no query string', async () => {
	await open('?q=x');
	await setSearch('');
	const search = await tab.ev('location.search');
	return search === '' || search === '?' || { search };
});
await c.check('page past the end shows the last page', async () => {
	await open('?page=999');
	return (await text('[data-testid="page-info"]')) === 'Page 25 of 25' && same(await ids(), page(view(), 25));
});
await c.check('search has an accessible label; table has a caption', async () => {
	return tab.ev(`(() => {
		const input = document.querySelector('[data-testid="search"]');
		const label = input.getAttribute('aria-label') || (input.labels && input.labels.length && __text(input.labels[0])) ||
			(input.getAttribute('aria-labelledby') && __text(document.getElementById(input.getAttribute('aria-labelledby'))));
		const caption = document.querySelector('table caption');
		return !!(label && String(label).trim()) && !!caption && __text(caption).length > 0;
	})()`);
});
await c.check('no sideways page scroll at 390 px', async () => {
	await tab.size(390, 844);
	await open();
	writeFileSync(join(out, 'mobile.png'), await tab.screenshot(false));
	const overflow = await tab.ev('document.documentElement.scrollWidth - innerWidth');
	return overflow <= 0 || { overflow };
});

const summary = { ...c.summary(), pageErrors: tab.errors.slice(0, 10) };
tab.close();
site.close();
writeFileSync(join(out, 'result.json'), JSON.stringify(summary, null, 2));
console.log(`F1: ${summary.passed}/${summary.total}`);
