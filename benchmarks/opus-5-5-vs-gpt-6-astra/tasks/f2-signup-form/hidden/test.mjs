// Hidden tests for F2, the sign-up form. Run: node test.mjs <workspace> <out-dir>
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { serve, browser, checks, same, sleep, PAGE_HELPERS } from '../../../tools/harness.mjs';

const [, , workspace, out] = process.argv;
mkdirSync(out, { recursive: true });
const countries = JSON.parse(readFileSync(new URL('../template/countries.json', import.meta.url), 'utf8'));
const dist = join(workspace, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
	writeFileSync(join(out, 'result.json'), JSON.stringify({ passed: 0, total: 17, results: [], note: 'no dist/index.html' }, null, 2));
	process.exit(0);
}

const FIELDS = ['username', 'email', 'password', 'confirm', 'birthDate', 'country', 'terms'];
const site = await serve(dist);
const tab = await browser();
const c = checks();
const open = async (query = '?today=2026-09-25') => {
	await tab.go(site.url + '/' + query);
	await tab.ev(PAGE_HELPERS);
	await tab.until(`!!document.getElementById('username')`, 6000);
};
const set = async (id, value) => {
	await tab.ev(`__set(document.getElementById(${JSON.stringify(id)}), ${JSON.stringify(value)}), true`);
	await sleep(150);
};
const blur = async (id) => {
	await tab.ev(`(() => { const el = document.getElementById(${JSON.stringify(id)}); el.focus(); el.blur(); return true; })()`);
	await sleep(150);
};
const error = (id) => tab.ev(`(document.querySelector('[data-testid="error-${id}"]')?.textContent ?? '<missing>').replace(/\\s+/g, ' ').trim()`);
const submit = async () => {
	await tab.ev(`document.querySelector('[data-testid="submit"]').click(), true`);
	await sleep(300);
};
// Types each value in turn, into a field that has already been blurred, and reads the error each time.
const sequence = async (id, cases) => {
	await open();
	await blur(id);
	const got = [];
	for (const [value] of cases) {
		await set(id, value);
		got.push(await error(id));
	}
	const want = cases.map(([, message]) => message);
	return same(got, want) || { got, want };
};

await tab.size(1280, 900);
await open();
writeFileSync(join(out, 'desktop.png'), await tab.screenshot(true));

await c.check('fields in order, each with a label; country options; submit', async () => {
	const got = await tab.ev(`(() => {
		const els = [...document.querySelectorAll('input, select')].map((el) => el.id).filter((id) => ${JSON.stringify(FIELDS)}.includes(id));
		const labelled = ${JSON.stringify(FIELDS)}.every((id) => document.getElementById(id)?.labels?.length > 0);
		const options = [...document.getElementById('country').options].map((o) => [o.value, o.textContent.trim()]);
		return { els, labelled, first: options[0][0], options: options.slice(1), date: document.getElementById('birthDate').type, box: document.getElementById('terms').type, submit: !!document.querySelector('[data-testid="submit"]') };
	})()`);
	const want = { els: FIELDS, labelled: true, first: '', options: countries.map((x) => [x.code, x.name]), date: 'date', box: 'checkbox', submit: true };
	return same(got, want) || { got, want };
});
await c.check('no errors before anything is touched', async () => {
	const got = [];
	for (const id of FIELDS) got.push(await error(id));
	return got.every((m) => m === '') || { got };
});
await c.check('no error while typing, before the field loses focus', async () => {
	await open();
	await set('username', 'a');
	await set('username', 'ab');
	return (await error('username')) === '';
});
await c.check('username rules in order, live after blur', () =>
	sequence('username', [
		['', 'Choose a username.'],
		['ab', 'Use 3–20 characters.'],
		['abcdefghijklmnopqrstu', 'Use 3–20 characters.'],
		['1abc', 'Start with a letter, then use letters, numbers or underscores.'],
		['ab-cd', 'Start with a letter, then use letters, numbers or underscores.'],
		['_abc', 'Start with a letter, then use letters, numbers or underscores.'],
		['ADMIN', 'That username is taken.'],
		['tidepool', 'That username is taken.'],
		['maria_22', ''],
		['Z9_', '']
	])
);
await c.check('email rules', () =>
	sequence('email', [
		['', 'Enter your email.'],
		['   ', 'Enter your email.'],
		['a@b', 'Enter a valid email address.'],
		['a@b.c', 'Enter a valid email address.'],
		['a b@c.de', 'Enter a valid email address.'],
		['a@@b.de', 'Enter a valid email address.'],
		['@b.de', 'Enter a valid email address.'],
		['a@b..de', 'Enter a valid email address.'],
		['a@.b.de', 'Enter a valid email address.'],
		['a@b.d2', 'Enter a valid email address.'],
		['  Jane.Doe@Example.COM  ', ''],
		['x+tag@sub.domain.io', '']
	])
);
await c.check('password rules', async () => {
	const first = await sequence('password', [
		['', 'Enter a password.'],
		['short1A!', 'Use at least 10 characters.'],
		['alllowercase1!', 'Add a lowercase letter, an uppercase letter, a number and a symbol.'],
		['NoSymbols123', 'Add a lowercase letter, an uppercase letter, a number and a symbol.'],
		['NODIGITS!!aa', 'Add a lowercase letter, an uppercase letter, a number and a symbol.'],
		['Tide!pool2026', '']
	]);
	await set('username', 'Maria_22');
	await set('password', 'xmaria_22X!9');
	const username = await error('password');
	await set('username', 'ab');
	await set('password', 'xabcdEFG!9');
	const short = await error('password');
	return (first === true && username === "Don't include your username." && short === '') || { first, username, short };
});
await c.check('password strength meter', async () => {
	await open();
	const got = [];
	for (const value of ['', 'a', 'aA', 'aA1', 'aA1!', 'aA1!aaaaaa', 'aaaaaaaaaa', 'aaaaaaaaaA', 'Tide!pool2026']) {
		await set('password', value);
		got.push(await tab.ev(`document.querySelector('[data-testid="strength"]').textContent.trim()`));
	}
	const want = ['', 'Weak', 'Weak', 'Fair', 'Strong', 'Very strong', 'Weak', 'Fair', 'Very strong'];
	return same(got, want) || { got, want };
});
await c.check('confirm password, and it follows password changes', async () => {
	await open();
	await set('password', 'Tide!pool2026');
	await blur('confirm');
	const empty = await error('confirm');
	await set('confirm', 'Tide!pool202');
	const mismatch = await error('confirm');
	await set('confirm', 'Tide!pool2026');
	const match = await error('confirm');
	await set('password', 'Tide!pool2027');
	const changed = await error('confirm');
	const got = [empty, mismatch, match, changed];
	const want = ['Confirm your password.', "Passwords don't match.", '', "Passwords don't match."];
	return same(got, want) || { got, want };
});
await c.check('date of birth with ?today=2026-09-25', () =>
	sequence('birthDate', [
		['', 'Enter your date of birth.'],
		['2026-09-26', 'That date is in the future.'],
		['2026-09-25', 'You must be at least 16.'],
		['2010-09-26', 'You must be at least 16.'],
		['2010-09-25', ''],
		['1990-01-31', '']
	])
);
await c.check('date of birth uses the real date without ?today', async () => {
	await open('');
	const now = new Date();
	const pad = (n) => String(n).padStart(2, '0');
	const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
	const sixteen = new Date(now.getFullYear() - 16, now.getMonth(), now.getDate());
	const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	await blur('birthDate');
	await set('birthDate', iso(tomorrow));
	const future = await error('birthDate');
	await set('birthDate', iso(sixteen));
	const exactly = await error('birthDate');
	return (future === 'That date is in the future.' && exactly === '') || { future, exactly };
});
await c.check('country and terms', async () => {
	await open();
	await blur('country');
	const country = await error('country');
	await set('country', 'PT');
	const chosen = await error('country');
	await submit();
	const terms = await error('terms');
	await tab.ev(`document.getElementById('terms').click(), true`);
	await sleep(150);
	const accepted = await error('terms');
	const got = [country, chosen, terms, accepted];
	const want = ['Choose your country.', '', 'Accept the terms to continue.', ''];
	return same(got, want) || { got, want };
});
await c.check('submit shows every error and focuses the first invalid field', async () => {
	await open();
	await set('email', 'jane@example.com');
	await tab.ev('document.activeElement.blur(), true');
	await submit();
	const errors = [];
	for (const id of FIELDS) errors.push(await error(id));
	const focus = await tab.ev('document.activeElement && document.activeElement.id');
	const want = ['Choose a username.', '', 'Enter a password.', 'Confirm your password.', 'Enter your date of birth.', 'Choose your country.', 'Accept the terms to continue.'];
	return (same(errors, want) && focus === 'username') || { errors, focus };
});
await c.check('focus moves to the next invalid field on the next submit', async () => {
	await open();
	await submit();
	await set('username', 'maria_22');
	await set('email', 'jane@example.com');
	await submit();
	return (await tab.ev('document.activeElement && document.activeElement.id')) === 'password';
});
await c.check('aria-invalid and aria-describedby follow the error', async () => {
	await open();
	await blur('username');
	const bad = await tab.ev(`(() => {
		const el = document.getElementById('username');
		const err = document.querySelector('[data-testid="error-username"]');
		return el.getAttribute('aria-invalid') === 'true' && !!err.id && (el.getAttribute('aria-describedby') || '').split(/\\s+/).includes(err.id);
	})()`);
	await set('username', 'maria_22');
	const good = await tab.ev(`document.getElementById('username').getAttribute('aria-invalid') !== 'true'`);
	return (bad && good) || { bad, good };
});
await c.check('valid submit shows the success message and payload', async () => {
	await open();
	await set('username', 'maria_22');
	await set('email', '  Jane.Doe@Example.COM ');
	await set('password', 'Tide!pool2026');
	await set('confirm', 'Tide!pool2026');
	await set('birthDate', '2000-02-29');
	await set('country', 'SK');
	await tab.ev(`document.getElementById('terms').click(), true`);
	await submit();
	await tab.until(`!!document.querySelector('[data-testid="success"]')`, 3000);
	const got = await tab.ev(`(() => {
		const success = document.querySelector('[data-testid="success"]');
		const payload = document.querySelector('pre[data-testid="payload"]');
		const form = document.getElementById('username');
		return { welcome: !!success && success.textContent.includes('Welcome, maria_22!'), payload: payload ? JSON.parse(payload.textContent) : null, formGone: !form || !__visible(form), leak: document.body.textContent.includes('Tide!pool2026') };
	})()`);
	const want = { welcome: true, payload: { username: 'maria_22', email: 'jane.doe@example.com', birthDate: '2000-02-29', country: 'SK' }, formGone: true, leak: false };
	const payloadOk = got.payload && same(Object.fromEntries(Object.entries(got.payload).sort()), Object.fromEntries(Object.entries(want.payload).sort()));
	return (got.welcome && payloadOk && got.formGone && !got.leak) || { got, want };
});
await c.check('taken usernames ignore case both ways', async () => {
	return sequence('username', [
		['MARIA', 'That username is taken.'],
		['Jan_Novak', 'That username is taken.'],
		['maria2', '']
	]);
});
await c.check('no sideways page scroll at 390 px', async () => {
	await tab.size(390, 844);
	await open();
	writeFileSync(join(out, 'mobile.png'), await tab.screenshot(true));
	const overflow = await tab.ev('document.documentElement.scrollWidth - innerWidth');
	return overflow <= 0 || { overflow };
});

const summary = { ...c.summary(), pageErrors: tab.errors.slice(0, 10) };
tab.close();
site.close();
writeFileSync(join(out, 'result.json'), JSON.stringify(summary, null, 2));
console.log(`F2: ${summary.passed}/${summary.total}`);
