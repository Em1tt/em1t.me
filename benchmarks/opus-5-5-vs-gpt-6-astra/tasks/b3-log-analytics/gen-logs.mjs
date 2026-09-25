// Writes a seeded access log. Usage: node gen-logs.mjs <file> <lines> <seed> [tricky]
// "tricky" mixes in every edge case the spec mentions at a higher rate.
import { createWriteStream } from 'node:fs';

const [, , file, linesArg, seedArg, tricky] = process.argv;
const LINES = Number(linesArg);
let seed = Number(seedArg);
const random = () => {
	seed |= 0;
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (n) => Math.floor(random() * n);
const pick = (list) => list[int(list.length)];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

const ips = Array.from({ length: 4000 }, (_, i) =>
	i % 17 === 0 ? `2001:db8:${(i * 7919).toString(16)}::${(i % 250).toString(16)}` : `${10 + int(200)}.${int(256)}.${int(256)}.${1 + int(254)}`
);
const sections = ['api', 'docs', 'blog', 'shop', 'account', 'static', 'search', 'img'];
const paths = Array.from({ length: 300 }, (_, i) => {
	if (i === 0) return '/';
	const s = sections[i % sections.length];
	return `/${s}/${['items', 'page', 'post', 'cart', 'settings', 'app.js', 'style.css', 'photo'][int(8)]}${i > 8 ? `-${i}` : ''}`;
});
// Popular paths get most of the traffic.
const pathAt = () => paths[Math.min(paths.length - 1, Math.floor(paths.length * Math.pow(random(), 2.6)))];
const statuses = [200, 200, 200, 200, 200, 200, 201, 204, 301, 302, 304, 304, 400, 401, 403, 404, 404, 429, 500, 502, 503];
const methods = ['GET', 'GET', 'GET', 'GET', 'GET', 'POST', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];
const start = Date.UTC(2026, 8, 23, 0, 0, 0);
const span = 3 * 86400000;

function timestamp(ms) {
	const d = new Date(ms);
	return `${pad(d.getUTCDate())}/${MONTHS[d.getUTCMonth()]}/${d.getUTCFullYear()}:${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
function valid() {
	let target = pathAt();
	const r = random();
	if (r < 0.08) target += `?q=${int(1000)}&page=${int(9)}`;
	else if (r < 0.1) target += '#section-2';
	else if (r < 0.105) target += `?ref=a#b`;
	if (tricky && random() < 0.01) target = pick(['?only=query', '*', '/a?', '/b#']);
	let status = pick(statuses);
	if (tricky && random() < 0.01) status = pick([101, 600, 999, 100]);
	const bytes = status === 204 || status === 304 || random() < 0.02 ? '-' : String(int(random() < 0.05 ? 5000000 : 60000));
	const slow = target.startsWith('/search') || target.startsWith('/api/report') ? 4 : 1;
	const duration = Math.floor(Math.exp(random() * 5.5) * slow * (random() < 0.01 ? 20 : 1));
	const version = random() < 0.1 ? '1.0' : '1.1';
	return `${pick(ips)} - - [${timestamp(start + int(span))} +0000] "${pick(methods)} ${target} HTTP/${version}" ${status} ${bytes} ${duration}`;
}
function malformed() {
	const line = valid();
	switch (int(tricky ? 10 : 6)) {
		case 0: return line.slice(0, 20 + int(30));
		case 1: return line.replace('+0000', '+0100');
		case 2: return line.replace(/ \d+$/, '');
		case 3: return line.replace('HTTP/1.1', 'HTTP/2.0').replace('HTTP/1.0', 'HTTP/2.0');
		case 4: return line.replace(/"([A-Z]+) /, (_, m) => `"${m.toLowerCase()} `);
		case 5: return 'garbage ' + int(1e6);
		case 6: return line + ' ';
		case 7: return line.replace(/ - - /, ' - ');
		case 8: return line.replace(/\[(\d{2})\/(\w{3})/, '[$1/$2x');
		default: return '   ';
	}
}

const out = createWriteStream(file);
let buffer = '';
for (let i = 0; i < LINES; i++) {
	const r = random();
	let line = r < (tricky ? 0.03 : 0.005) ? malformed() : valid();
	if (tricky && random() < 0.01) line = '';
	const eol = tricky && random() < 0.3 ? '\r\n' : '\n';
	buffer += line + eol;
	if (buffer.length > 1 << 20) {
		if (!out.write(buffer)) await new Promise((r) => out.once('drain', r));
		buffer = '';
	}
}
out.end(buffer);
await new Promise((r) => out.on('finish', r));
