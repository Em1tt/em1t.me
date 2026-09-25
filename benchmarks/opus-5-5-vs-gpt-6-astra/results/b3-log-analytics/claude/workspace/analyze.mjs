// Access log analytics: node analyze.mjs <path-to-log-file>
//
// Reads the log in large chunks and parses each line straight from the bytes,
// without building a string per line. The byte scanner accepts exactly the
// ASCII lines that LINE_RE matches; a line with non-ASCII bytes where the
// regex allows them (the IP and the target) is decoded as UTF-8 and checked
// with LINE_RE itself, so both paths agree with the regex.
import { openSync, readSync, closeSync } from 'node:fs';

const LINE_RE = /^(\S+) - - \[(\d{2})\/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) \+0000\] "([A-Z]+) (\S+) HTTP\/1\.[01]" (\d{3}) (\d+|-) (\d+)$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CHUNK = 16 << 20;
// Slack after the data in the read buffer, so the scanner may look a few
// bytes past a line's '\n' without leaving the buffer.
const PAD = 64;

// Byte classes for the \S+ scans.
const ORD = 0; // ASCII non-whitespace
const WS = 1; // ASCII whitespace, as matched by \s
const HIGH = 2; // non-ASCII: needs UTF-8 decoding
const CUT = 3; // '?' or '#': ends the path part of a target
const IP_CLASS = new Uint8Array(256);
for (const c of [9, 10, 11, 12, 13, 32]) IP_CLASS[c] = WS;
IP_CLASS.fill(HIGH, 0x80);
const TARGET_CLASS = IP_CLASS.slice();
TARGET_CLASS[0x3f] = CUT;
TARGET_CLASS[0x23] = CUT;

const FNV_OFFSET = 0x811c9dc5 | 0;
const FNV_PRIME = 0x01000193;

function fmix(h) {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return h ^ (h >>> 16);
}

// Must match the hash the scanner computes inline.
function hashBytes(src, s, e) {
  let h = FNV_OFFSET;
  for (let i = s; i < e; i++) h = Math.imul(h ^ src[i], FNV_PRIME);
  return fmix(h);
}

// Month number (1-12) for three name bytes, 0 if they are not a month name.
function monthOf(a, b, c) {
  switch ((a << 16) | (b << 8) | c) {
    case 0x4a616e: return 1; // Jan
    case 0x466562: return 2; // Feb
    case 0x4d6172: return 3; // Mar
    case 0x417072: return 4; // Apr
    case 0x4d6179: return 5; // May
    case 0x4a756e: return 6; // Jun
    case 0x4a756c: return 7; // Jul
    case 0x417567: return 8; // Aug
    case 0x536570: return 9; // Sep
    case 0x4f6374: return 10; // Oct
    case 0x4e6f76: return 11; // Nov
    case 0x446563: return 12; // Dec
  }
  return 0;
}

// Interns byte strings: maps each distinct key to a dense id (0, 1, 2, ...).
// Open addressing with linear probing; key bytes live in one arena.
class KeyTable {
  constructor() {
    this.size = 0;
    this.slots = new Int32Array(1 << 12); // entry id + 1, or 0 when empty
    this.mask = this.slots.length - 1;
    this.hashes = new Int32Array(1 << 11);
    this.offs = new Int32Array(1 << 11);
    this.lens = new Int32Array(1 << 11);
    this.arena = Buffer.allocUnsafe(1 << 16);
    this.used = 0;
  }

  id(src, s, e, h) {
    const len = e - s;
    const slots = this.slots;
    const mask = this.mask;
    let i = h & mask;
    for (let v = slots[i]; v !== 0; v = slots[i]) {
      const id = v - 1;
      if (this.hashes[id] === h && this.lens[id] === len) {
        const arena = this.arena;
        let o = this.offs[id];
        let j = s;
        while (j < e && arena[o] === src[j]) { o++; j++; }
        if (j === e) return id;
      }
      i = (i + 1) & mask;
    }
    return this.insert(src, s, e, h, i);
  }

  insert(src, s, e, h, slot) {
    const id = this.size;
    const len = e - s;
    if (id === this.hashes.length) {
      const cap = id * 2;
      this.hashes = grow(Int32Array, this.hashes, cap);
      this.offs = grow(Int32Array, this.offs, cap);
      this.lens = grow(Int32Array, this.lens, cap);
    }
    if ((id + 1) * 2 > this.slots.length) {
      this.rehash(this.slots.length * 2);
      slot = h & this.mask;
      while (this.slots[slot] !== 0) slot = (slot + 1) & this.mask;
    }
    if (this.used + len > this.arena.length) {
      const bigger = Buffer.allocUnsafe(Math.max(this.arena.length * 2, this.used + len));
      this.arena.copy(bigger, 0, 0, this.used);
      this.arena = bigger;
    }
    const arena = this.arena;
    let o = this.used;
    for (let j = s; j < e; j++) arena[o++] = src[j];
    this.hashes[id] = h;
    this.offs[id] = this.used;
    this.lens[id] = len;
    this.used = o;
    this.slots[slot] = id + 1;
    this.size = id + 1;
    return id;
  }

  rehash(capacity) {
    const slots = new Int32Array(capacity);
    const mask = capacity - 1;
    for (let id = 0; id < this.size; id++) {
      let i = this.hashes[id] & mask;
      while (slots[i] !== 0) i = (i + 1) & mask;
      slots[i] = id + 1;
    }
    this.slots = slots;
    this.mask = mask;
  }

  key(id) {
    return this.arena.toString('utf8', this.offs[id], this.offs[id] + this.lens[id]);
  }
}

// Counts per non-negative int32 key.
class CountTable {
  constructor() {
    this.size = 0;
    this.keys = new Int32Array(1 << 8); // key + 1, or 0 when empty
    this.counts = new Float64Array(1 << 8);
    this.mask = this.keys.length - 1;
  }

  add(key) {
    const keys = this.keys;
    const mask = this.mask;
    let i = fmix(key) & mask;
    for (let k = keys[i]; k !== 0; k = keys[i]) {
      if (k === key + 1) { this.counts[i]++; return; }
      i = (i + 1) & mask;
    }
    keys[i] = key + 1;
    this.counts[i] = 1;
    if (++this.size * 2 > keys.length) this.rehash(keys.length * 2);
  }

  rehash(capacity) {
    const oldKeys = this.keys;
    const oldCounts = this.counts;
    this.keys = new Int32Array(capacity);
    this.counts = new Float64Array(capacity);
    this.mask = capacity - 1;
    for (let j = 0; j < oldKeys.length; j++) {
      const k = oldKeys[j];
      if (k === 0) continue;
      let i = fmix(k - 1) & this.mask;
      while (this.keys[i] !== 0) i = (i + 1) & this.mask;
      this.keys[i] = k;
      this.counts[i] = oldCounts[j];
    }
  }

  entries() {
    const out = [];
    for (let i = 0; i < this.keys.length; i++) {
      if (this.keys[i] !== 0) out.push([this.keys[i] - 1, this.counts[i]]);
    }
    return out;
  }
}

function grow(Type, arr, capacity) {
  const bigger = new Type(capacity);
  bigger.set(arr);
  return bigger;
}

function newState() {
  return {
    n: 0, // valid lines
    malformed: 0,
    bytes: 0,
    statusByDigit: new Float64Array(10), // by first digit of the status code
    ips: new KeyTable(),
    paths: new KeyTable(),
    hours: new CountTable(), // by ((year * 12 + month - 1) * 100 + day) * 100 + hour
    durations: new Float64Array(1 << 16), // per valid line
    pathIds: new Int32Array(1 << 16), // per valid line
  };
}

// Parses the complete lines in buf[start, end); buf[end - 1] is '\n'.
function parseLines(st, buf, start, end) {
  const ips = st.ips;
  const paths = st.paths;
  const hours = st.hours;
  const statusByDigit = st.statusByDigit;
  let durations = st.durations;
  let pathIds = st.pathIds;
  let n = st.n;
  let malformed = st.malformed;
  let bytes = st.bytes;

  let p = start;
  while (p < end) {
    const ls = p;
    let c = buf[p];
    if (c === 10) { p++; continue; }
    if (c === 13 && buf[p + 1] === 10) { p += 2; continue; }

    // Fields of a valid line, set by the byte scanner or by the regex fallback.
    let ipSrc = buf, ipS = ls, ipE = 0, ipH = 0;
    let pathSrc = buf, pathS = 0, pathE = 0, pathH = 0;
    let statusDigit = 0, size = 0, duration = 0, hourKey = 0;
    let valid = false;
    let fallback = false;

    // On a mismatch this breaks out with p at or before the line's '\n'.
    scan: {
      // (\S+) client IP
      let h = FNV_OFFSET;
      let k;
      for (;;) {
        k = IP_CLASS[c];
        if (k !== ORD) break;
        h = Math.imul(h ^ c, FNV_PRIME);
        c = buf[++p];
      }
      if (k === HIGH) { fallback = true; break scan; }
      if (p === ls) break scan;
      ipE = p;
      ipH = fmix(h);

      // " - - ["
      if (c !== 32 || buf[p + 1] !== 45 || buf[p + 2] !== 32 || buf[p + 3] !== 45 ||
          buf[p + 4] !== 32 || buf[p + 5] !== 91) break scan;
      p += 6;

      // dd/Mon/yyyy:hh:mm:ss +0000] "
      const d0 = buf[p] - 48, d1 = buf[p + 1] - 48;
      if (d0 >>> 0 > 9 || d1 >>> 0 > 9 || buf[p + 2] !== 47) break scan;
      const month = monthOf(buf[p + 3], buf[p + 4], buf[p + 5]);
      if (month === 0 || buf[p + 6] !== 47) break scan;
      const y0 = buf[p + 7] - 48, y1 = buf[p + 8] - 48, y2 = buf[p + 9] - 48, y3 = buf[p + 10] - 48;
      if (y0 >>> 0 > 9 || y1 >>> 0 > 9 || y2 >>> 0 > 9 || y3 >>> 0 > 9 || buf[p + 11] !== 58) break scan;
      const h0 = buf[p + 12] - 48, h1 = buf[p + 13] - 48;
      if (h0 >>> 0 > 9 || h1 >>> 0 > 9 || buf[p + 14] !== 58) break scan;
      if ((buf[p + 15] - 48) >>> 0 > 9 || (buf[p + 16] - 48) >>> 0 > 9 || buf[p + 17] !== 58 ||
          (buf[p + 18] - 48) >>> 0 > 9 || (buf[p + 19] - 48) >>> 0 > 9) break scan;
      if (buf[p + 20] !== 32 || buf[p + 21] !== 43 || buf[p + 22] !== 48 || buf[p + 23] !== 48 ||
          buf[p + 24] !== 48 || buf[p + 25] !== 48 || buf[p + 26] !== 93 || buf[p + 27] !== 32 ||
          buf[p + 28] !== 34) break scan;
      hourKey = (((y0 * 1000 + y1 * 100 + y2 * 10 + y3) * 12 + month - 1) * 100 + d0 * 10 + d1) * 100 + h0 * 10 + h1;
      p += 29;

      // ([A-Z]+) method
      const ms = p;
      c = buf[p];
      while ((c - 65) >>> 0 < 26) c = buf[++p];
      if (p === ms || c !== 32) break scan;
      c = buf[++p];

      // (\S+) target; the path is the part before the first '?' or '#'
      const ts = p;
      h = FNV_OFFSET;
      for (;;) {
        k = TARGET_CLASS[c];
        if (k !== ORD) break;
        h = Math.imul(h ^ c, FNV_PRIME);
        c = buf[++p];
      }
      pathS = ts;
      pathE = p;
      pathH = fmix(h);
      if (k === CUT) {
        do {
          c = buf[++p];
          k = IP_CLASS[c];
        } while (k === ORD);
      }
      if (k === HIGH) { fallback = true; break scan; }
      if (p === ts) break scan;

      // " HTTP/1.[01]" "
      if (c !== 32 || buf[p + 1] !== 72 || buf[p + 2] !== 84 || buf[p + 3] !== 84 ||
          buf[p + 4] !== 80 || buf[p + 5] !== 47 || buf[p + 6] !== 49 || buf[p + 7] !== 46 ||
          (buf[p + 8] !== 48 && buf[p + 8] !== 49) || buf[p + 9] !== 34 || buf[p + 10] !== 32) break scan;
      p += 11;

      // (\d{3}) status
      const s0 = buf[p] - 48;
      if (s0 >>> 0 > 9 || (buf[p + 1] - 48) >>> 0 > 9 || (buf[p + 2] - 48) >>> 0 > 9 ||
          buf[p + 3] !== 32) break scan;
      statusDigit = s0;
      p += 4;

      // (\d+|-) size
      c = buf[p];
      if (c === 45) {
        c = buf[++p];
      } else {
        const ss = p;
        let v = 0;
        while ((c - 48) >>> 0 < 10) { v = v * 10 + (c - 48); c = buf[++p]; }
        if (p === ss) break scan;
        // Up to 15 digits the running value is exact; beyond, round like Number().
        size = p - ss <= 15 ? v : Number(buf.toString('latin1', ss, p));
      }
      if (c !== 32) break scan;
      c = buf[++p];

      // (\d+) duration, then the end of the line
      const ds = p;
      let v = 0;
      while ((c - 48) >>> 0 < 10) { v = v * 10 + (c - 48); c = buf[++p]; }
      if (p === ds) break scan;
      duration = p - ds <= 15 ? v : Number(buf.toString('latin1', ds, p));
      if (c === 10) p += 1;
      else if (c === 13 && buf[p + 1] === 10) p += 2;
      else break scan;
      valid = true;
    }

    if (!valid) {
      const nl = buf.indexOf(10, p);
      if (fallback) {
        const le = buf[nl - 1] === 13 ? nl - 1 : nl;
        const m = LINE_RE.exec(buf.toString('utf8', ls, le));
        if (m !== null) {
          // Keys are the UTF-8 bytes of the decoded strings, so they compare
          // the same way as the strings do.
          ipSrc = Buffer.from(m[1], 'utf8');
          ipS = 0;
          ipE = ipSrc.length;
          ipH = hashBytes(ipSrc, 0, ipE);
          const target = m[9];
          const cut = target.search(/[?#]/);
          pathSrc = Buffer.from(cut < 0 ? target : target.slice(0, cut), 'utf8');
          pathS = 0;
          pathE = pathSrc.length;
          pathH = hashBytes(pathSrc, 0, pathE);
          statusDigit = m[10].charCodeAt(0) - 48;
          size = m[11] === '-' ? 0 : Number(m[11]);
          duration = Number(m[12]);
          hourKey = ((Number(m[4]) * 12 + MONTHS.indexOf(m[3])) * 100 + Number(m[2])) * 100 + Number(m[5]);
          valid = true;
        }
      }
      p = nl + 1;
      if (!valid) { malformed++; continue; }
    }

    ips.id(ipSrc, ipS, ipE, ipH);
    const pathId = paths.id(pathSrc, pathS, pathE, pathH);
    if (n === durations.length) {
      durations = st.durations = grow(Float64Array, durations, n * 2);
      pathIds = st.pathIds = grow(Int32Array, pathIds, n * 2);
    }
    durations[n] = duration;
    pathIds[n] = pathId;
    n++;
    statusByDigit[statusDigit]++;
    bytes += size;
    hours.add(hourKey);
  }

  st.n = n;
  st.malformed = malformed;
  st.bytes = bytes;
}

function parseFile(file) {
  const st = newState();
  const fd = openSync(file, 'r');
  try {
    let cap = CHUNK;
    let buf = Buffer.allocUnsafe(cap + PAD);
    let len = 0; // bytes of the not yet parsed tail of the file in buf[0, len)
    for (;;) {
      if (len === cap) {
        // A single line longer than the buffer.
        cap *= 2;
        const bigger = Buffer.allocUnsafe(cap + PAD);
        buf.copy(bigger, 0, 0, len);
        buf = bigger;
      }
      const got = readSync(fd, buf, len, cap - len, null);
      if (got === 0) {
        if (len > 0) {
          buf[len] = 10; // the last line has no line break
          parseLines(st, buf, 0, len + 1);
        }
        break;
      }
      len += got;
      const lastNl = buf.lastIndexOf(10, len - 1);
      if (lastNl < 0) continue;
      parseLines(st, buf, 0, lastNl + 1);
      buf.copyWithin(0, lastNl + 1, len);
      len -= lastNl + 1;
    }
  } finally {
    closeSync(fd);
  }
  return st;
}

// 1-based nearest rank of the p-th percentile among n values.
function rank(p, n) {
  return Math.floor((p * n + 99) / 100);
}

// String order by UTF-16 code units.
function compareStrings(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function topPaths(paths, counts, limit) {
  const total = counts.length;
  if (total === 0) return [];
  const k = Math.min(limit, total);
  const cutoff = counts.slice().sort()[total - k]; // k-th largest count
  // Every path above the cutoff is in; among those at the cutoff, the
  // smallest ones fill the remaining places.
  const top = [];
  const tied = [];
  let tiedPlaces = k;
  for (let id = 0; id < total; id++) {
    if (counts[id] > cutoff) { top.push({ path: paths.key(id), requests: counts[id] }); tiedPlaces--; }
  }
  for (let id = 0; id < total; id++) {
    if (counts[id] !== cutoff) continue;
    const path = paths.key(id);
    if (tied.length === tiedPlaces) {
      if (compareStrings(path, tied[tiedPlaces - 1]) >= 0) continue;
      tied.pop();
    }
    let i = tied.length;
    while (i > 0 && compareStrings(path, tied[i - 1]) < 0) i--;
    tied.splice(i, 0, path);
  }
  for (const path of tied) top.push({ path, requests: cutoff });
  return top.sort((a, b) => b.requests - a.requests || compareStrings(a.path, b.path));
}

function slowestPaths(paths, counts, durations, pathIds, n, minRequests, limit) {
  // Gather the durations of each qualifying path into its own segment.
  const segStart = new Int32Array(counts.length).fill(-1);
  const qualifying = [];
  let total = 0;
  for (let id = 0; id < counts.length; id++) {
    if (counts[id] >= minRequests) {
      segStart[id] = total;
      total += counts[id];
      qualifying.push(id);
    }
  }
  if (qualifying.length === 0) return [];
  const grouped = new Float64Array(total);
  const next = segStart.slice();
  for (let i = 0; i < n; i++) {
    const id = pathIds[i];
    const at = next[id];
    if (at >= 0) {
      grouped[at] = durations[i];
      next[id] = at + 1;
    }
  }
  const rows = qualifying.map((id) => {
    const seg = grouped.subarray(segStart[id], segStart[id] + counts[id]).sort();
    return { path: paths.key(id), p95: seg[rank(95, counts[id]) - 1], requests: counts[id] };
  });
  rows.sort((a, b) => (a.p95 !== b.p95 ? (a.p95 < b.p95 ? 1 : -1) : compareStrings(a.path, b.path)));
  return rows.slice(0, limit);
}

function hourlyCounts(hours) {
  const pad = (v, width) => String(v).padStart(width, '0');
  const out = {};
  for (const [key, count] of hours.entries().sort((a, b) => a[0] - b[0])) {
    const hour = key % 100;
    const day = Math.floor(key / 100) % 100;
    const monthIndex = Math.floor(key / 10000) % 12;
    const year = Math.floor(key / 120000);
    out[`${pad(year, 4)}-${pad(monthIndex + 1, 2)}-${pad(day, 2)}T${pad(hour, 2)}`] = count;
  }
  return out;
}

function report(st) {
  const n = st.n;
  const durations = st.durations.subarray(0, n);
  const pathIds = st.pathIds.subarray(0, n);
  const counts = new Int32Array(st.paths.size);
  for (let i = 0; i < n; i++) counts[pathIds[i]]++;
  const sd = st.statusByDigit;

  const result = {
    requests: n,
    malformed: st.malformed,
    uniqueIps: st.ips.size,
    status: { '2xx': sd[2], '3xx': sd[3], '4xx': sd[4], '5xx': sd[5], other: sd[0] + sd[1] + sd[6] + sd[7] + sd[8] + sd[9] },
    bytes: st.bytes,
    topPaths: topPaths(st.paths, counts, 10),
    durationMs: { p50: null, p95: null, p99: null, max: null },
    hourly: hourlyCounts(st.hours),
    // Before the global sort below, which reorders durations.
    slowest: slowestPaths(st.paths, counts, durations, pathIds, n, 100, 5),
  };
  if (n > 0) {
    durations.sort();
    result.durationMs = {
      p50: durations[rank(50, n) - 1],
      p95: durations[rank(95, n) - 1],
      p99: durations[rank(99, n) - 1],
      max: durations[n - 1],
    };
  }
  return result;
}

const file = process.argv[2];
if (file === undefined) {
  process.stderr.write('usage: node analyze.mjs <path-to-log-file>\n');
  process.exitCode = 2;
} else {
  let st;
  try {
    st = parseFile(file);
  } catch (err) {
    process.stderr.write(`analyze: ${err.message}\n`);
    process.exitCode = 1;
  }
  if (st !== undefined) process.stdout.write(JSON.stringify(report(st), null, 2) + '\n');
}
