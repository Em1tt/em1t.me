// Shared pieces for the hidden tests: a static file server, a headless Chrome driven over the
// DevTools protocol, and a tiny check runner that records pass/fail per named check.
import { spawn, execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.webp': 'image/webp',
	'.woff2': 'font/woff2',
	'.woff': 'font/woff',
	'.ico': 'image/x-icon',
	'.txt': 'text/plain'
};

/** Serves a directory at http://127.0.0.1:<port>/, index.html for directories. */
export function serve(root) {
	const base = resolve(root);
	const server = createServer((req, res) => {
		const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
		let file = join(base, path);
		if (!file.startsWith(base)) return res.writeHead(403).end();
		if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
		if (!existsSync(file)) return res.writeHead(404).end('not found');
		res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
		res.end(readFileSync(file));
	});
	return new Promise((ok) =>
		server.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() }))
	);
}

/** A headless Chrome tab. */
export async function browser() {
	const port = 9400 + Math.floor(Math.random() * 400);
	const chrome = spawn(
		'C:/Program Files/Google/Chrome/Application/chrome.exe',
		['--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars', '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'bench-cdp-'))}`, 'about:blank'],
		{ stdio: 'ignore' }
	);
	let list;
	for (let i = 0; i < 80 && !list; i++) list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()).catch(() => sleep(250));
	const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
	await new Promise((r) => (ws.onopen = r));
	let id = 0;
	const pending = new Map();
	const errors = [];
	const requests = [];
	ws.onmessage = (e) => {
		const m = JSON.parse(e.data);
		if (m.id && pending.has(m.id)) {
			pending.get(m.id)(m);
			pending.delete(m.id);
		}
		if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description?.split('\n')[0] ?? m.params.exceptionDetails.text);
		if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url);
	};
	const send = (method, params = {}) =>
		new Promise((r) => {
			const i = ++id;
			pending.set(i, r);
			ws.send(JSON.stringify({ id: i, method, params }));
		});
	const ev = async (expression) => {
		const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
		if (r.result?.exceptionDetails) throw new Error((r.result.exceptionDetails.exception?.description ?? expression).split('\n')[0]);
		return r.result?.result?.value;
	};
	await send('Page.enable');
	await send('Runtime.enable');
	await send('Network.enable');
	// Headless tabs aren't focused, so focus() and blur() would do nothing without this.
	await send('Emulation.setFocusEmulationEnabled', { enabled: true });
	const tab = {
		send,
		ev,
		errors,
		requests,
		async size(width, height = 900) {
			await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
		},
		async go(url, settle = 1200) {
			await send('Page.navigate', { url });
			await sleep(300);
			for (let i = 0; i < 60 && (await ev('document.readyState').catch(() => '')) !== 'complete'; i++) await sleep(150);
			await sleep(settle);
		},
		/** Waits until the expression is truthy, up to ms. */
		async until(expression, ms = 4000) {
			const end = Date.now() + ms;
			while (Date.now() < end) {
				if (await ev(expression).catch(() => false)) return true;
				await sleep(80);
			}
			return false;
		},
		async screenshot(fullPage = false) {
			const params = { format: 'png', captureBeyondViewport: fullPage };
			if (fullPage) {
				const { w, h } = await ev('({ w: document.documentElement.scrollWidth, h: Math.min(document.documentElement.scrollHeight, 12000) })');
				params.clip = { x: 0, y: 0, width: w, height: h, scale: 1 };
			}
			const r = await send('Page.captureScreenshot', params);
			return Buffer.from(r.result.data, 'base64');
		},
		close() {
			ws.close();
			try {
				execSync(`taskkill /PID ${chrome.pid} /T /F`, { stdio: 'ignore' });
			} catch {
				// Already gone.
			}
		}
	};
	return tab;
}

/** Page-side helpers that change form controls the way a user would, for any framework. */
export const PAGE_HELPERS = `
window.__set = (el, value) => {
	const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
	el.focus();
	Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
	el.dispatchEvent(new Event('input', { bubbles: true }));
	el.dispatchEvent(new Event('change', { bubbles: true }));
};
window.__visible = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
window.__text = (el) => (el ? el.textContent.replace(/\\s+/g, ' ').trim() : null);
true;
`;

/** Runs named checks in order; a check passes when it returns true (or an object with ok: true). */
export function checks() {
	const results = [];
	return {
		results,
		async check(name, fn) {
			try {
				const out = await fn();
				const ok = out === true || (out && out.ok === true);
				results.push({ name, ok, detail: ok ? undefined : typeof out === 'object' ? JSON.stringify(out).slice(0, 400) : String(out) });
			} catch (error) {
				results.push({ name, ok: false, detail: `threw: ${String(error.message ?? error).slice(0, 300)}` });
			}
		},
		summary() {
			const passed = results.filter((r) => r.ok).length;
			return { passed, total: results.length, results };
		}
	};
}

export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
