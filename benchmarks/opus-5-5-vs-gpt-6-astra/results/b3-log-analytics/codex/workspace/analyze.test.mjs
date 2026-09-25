import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const workspace = fileURLToPath(new URL('.', import.meta.url));
const program = join(workspace, 'analyze.mjs');

function analyzeFile(path) {
  const result = spawnSync(process.execPath, [program, path], {
    cwd: workspace,
    encoding: 'utf8',
    timeout: 15_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function analyze(contents) {
  const directory = mkdtempSync(join(workspace, '.analyze-test-'));
  try {
    const path = join(directory, 'input.log');
    writeFileSync(path, contents);
    return analyzeFile(path);
  } finally {
    const child = relative(workspace, directory);
    assert.ok(child && !child.startsWith('..') && !isAbsolute(child));
    rmSync(directory, { recursive: true, force: true });
  }
}

function line({
  ip = '203.0.113.7', day = '25', month = 'Sep', year = '2026',
  hour = '13', minute = '45', second = '01', method = 'GET',
  target = '/', version = '1.1', status = '200', bytes = '0', duration = '0',
} = {}) {
  return `${ip} - - [${day}/${month}/${year}:${hour}:${minute}:${second} +0000] "${method} ${target} HTTP/${version}" ${status} ${bytes} ${duration}`;
}

function emptyStats(malformed = 0) {
  return {
    requests: 0, malformed, uniqueIps: 0,
    status: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, other: 0 },
    bytes: 0, topPaths: [],
    durationMs: { p50: null, p95: null, p99: null, max: null },
    hourly: {}, slowest: [],
  };
}

test('sample matches the supplied expected JSON', () => {
  const expected = JSON.parse(readFileSync(join(workspace, 'sample-expected.json'), 'utf8'));
  assert.deepEqual(analyzeFile(join(workspace, 'sample.log')), expected);
});

test('empty lines are ignored, while nonempty malformed lines are counted', () => {
  assert.deepEqual(analyze(''), emptyStats());
  assert.deepEqual(analyze('\n\r\n\n \n\t\ninvalid\n'), emptyStats(3));
});

test('only LF and CRLF terminate lines, and matching consumes the complete line', () => {
  const result = analyze([
    `${line({ duration: '1' })}\r\n`,
    `${line({ duration: '3' })}\n\n`,
    `${line()}\u2028\n`,
    `${line()}\u2029\n`,
    `${line()}\r\r\n`,
    `bad\r${line()}\n`,
    line({ duration: '2' }),
  ].join(''));
  assert.equal(result.requests, 3);
  assert.equal(result.malformed, 4);
  assert.deepEqual(result.durationMs, { p50: 2, p95: 3, p99: 3, max: 3 });
  assert.deepEqual(analyze(`${line()}\r`), emptyStats(1));
});

test('validity follows the regex, and hourly keys preserve the captured date fields', () => {
  const result = analyze([
    line({ ip: 'not-an-ip', day: '00', year: '0000', hour: '99', minute: '99', second: '99', method: 'CUSTOM', version: '1.0', status: '000', bytes: '0007', duration: '0009' }),
    line({ ip: 'not-an-ip', day: '99', month: 'Jan', year: '0000', hour: '00', status: '999', bytes: '-' }),
    line({ method: 'get' }),
    line({ version: '2.0' }),
    line({ month: 'SEP' }),
    line({ bytes: '-1' }),
    line({ duration: '1.5' }),
    `${line()} `,
  ].join('\n'));
  assert.equal(result.requests, 2);
  assert.equal(result.malformed, 6);
  assert.equal(result.uniqueIps, 1);
  assert.equal(result.bytes, 7);
  assert.deepEqual(result.status, { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, other: 2 });
  assert.deepEqual(result.durationMs, { p50: 0, p95: 9, p99: 9, max: 9 });
  assert.deepEqual(Object.entries(result.hourly), [['0000-01-99T00', 1], ['0000-09-00T99', 1]]);
});

test('path delimiters, special property names, and UTF-16 ties are handled literally', () => {
  const targets = ['?x=1', '#fragment', '/a?x#y', '/a#x?y', '__proto__', 'constructor', '/Z', '/a', '/ä', '/\uE000', '/😀'];
  const result = analyze(targets.map(target => line({ target })).join('\n'));
  assert.deepEqual(result.topPaths, [
    { path: '/a', requests: 3 },
    { path: '', requests: 2 },
    { path: '/Z', requests: 1 },
    { path: '/ä', requests: 1 },
    { path: '/😀', requests: 1 },
    { path: '/\uE000', requests: 1 },
    { path: '__proto__', requests: 1 },
    { path: 'constructor', requests: 1 },
  ]);
  assert.equal(result.requests, targets.length);
});

test('status buckets include their endpoints and sizes sum numerically', () => {
  const statuses = ['000', '199', '200', '299', '300', '399', '400', '499', '500', '599', '600', '999'];
  const result = analyze(statuses.map((status, index) => line({ status, bytes: index % 2 ? '-' : '0002', ip: `client-${index % 3}` })).join('\n'));
  assert.deepEqual(result.status, { '2xx': 2, '3xx': 2, '4xx': 2, '5xx': 2, other: 4 });
  assert.equal(result.bytes, 12);
  assert.equal(result.uniqueIps, 3);
});

test('nearest ranks use numeric durations without 32-bit truncation', () => {
  const result = analyze([1, 2, 10, 4_294_967_297].map(duration => line({ duration })).join('\n'));
  assert.deepEqual(result.durationMs, { p50: 2, p95: 4_294_967_297, p99: 4_294_967_297, max: 4_294_967_297 });
  assert.deepEqual(result.slowest, []);
});

test('slowest requires 100 requests, uses per-path ranks, and selects five with UTF-16 ties', () => {
  const requests = [];
  const add = (target, durations) => requests.push(...durations.map(duration => line({ target, duration })));
  add('/excluded', Array(99).fill(10_000));
  add('/rank100', [...Array(95).fill(8), ...Array(5).fill(500)]);
  add('/rank101', [...Array(95).fill(8), ...Array(6).fill(500)]);
  for (const target of ['/a', '/Z', '/ä', '/😀', '/\uE000']) add(target, Array(100).fill(500));
  const result = analyze(requests.join('\n'));
  assert.deepEqual(result.slowest, [
    { path: '/Z', p95: 500, requests: 100 },
    { path: '/a', p95: 500, requests: 100 },
    { path: '/rank101', p95: 500, requests: 101 },
    { path: '/ä', p95: 500, requests: 100 },
    { path: '/😀', p95: 500, requests: 100 },
  ]);
  const boundary = analyze([
    ...Array(95).fill(line({ target: '/eligible', duration: 8 })),
    ...Array(5).fill(line({ target: '/eligible', duration: 500 })),
    ...Array(99).fill(line({ target: '/ineligible', duration: 1000 })),
  ].join('\n'));
  assert.deepEqual(boundary.slowest, [{ path: '/eligible', p95: 8, requests: 100 }]);
});

test('topPaths limits equal-count results to the first ten paths', () => {
  const targets = Array.from({ length: 12 }, (_, i) => `/p${String(i).padStart(2, '0')}`).reverse();
  const result = analyze(targets.map(target => line({ target })).join('\n'));
  assert.deepEqual(result.topPaths, targets.slice().sort().slice(0, 10).map(path => ({ path, requests: 1 })));
});

test('UTF-8 characters and CRLF remain intact across likely stream chunk boundaries', () => {
  const content = [];
  let offset = 0;
  for (const boundary of [64 * 1024, 256 * 1024, 1024 * 1024, 2 * 1024 * 1024]) {
    const request = line({ target: '/😀' });
    const prefixLength = Buffer.byteLength(request.slice(0, request.indexOf('😀')));
    const padding = boundary - 1 - offset - prefixLength;
    content.push('\n'.repeat(padding), request, '\r\n');
    offset = boundary - 1 - prefixLength + Buffer.byteLength(request) + 2;
  }
  const request = line({ target: '/😀' });
  content.push('\n'.repeat(4 * 1024 * 1024 - 1 - offset - Buffer.byteLength(request)), request, '\r\n');
  const result = analyze(content.join(''));
  assert.equal(result.requests, 5);
  assert.equal(result.malformed, 0);
  assert.deepEqual(result.topPaths, [{ path: '/😀', requests: 5 }]);
});
