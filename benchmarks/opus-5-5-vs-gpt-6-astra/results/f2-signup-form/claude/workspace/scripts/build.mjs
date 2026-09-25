// Builds the static site into dist/: a single self-contained index.html with the
// styles, the script and the data from countries.json / taken-usernames.json inlined,
// so it works from any static file server without extra requests.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'dist');

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** Writes non-ASCII characters as character references, so the page renders correctly
 * even if a server labels it with the wrong charset. */
const asciiOnly = (html) =>
  html.replace(/[^\x00-\x7f]/gu, (char) => `&#x${char.codePointAt(0).toString(16)};`);

async function readCountries() {
  const countries = JSON.parse(await readFile(path.join(root, 'countries.json'), 'utf8'));
  for (const entry of countries) {
    if (typeof entry?.code !== 'string' || typeof entry?.name !== 'string') {
      throw new Error(`countries.json: every entry needs a string "code" and "name", got ${JSON.stringify(entry)}`);
    }
  }
  return countries;
}

async function bundle(entry) {
  const result = await esbuild.build({
    entryPoints: [path.join(root, 'src', entry)],
    bundle: true,
    minify: true,
    write: false,
    format: 'iife',
    target: ['es2020', 'chrome90', 'firefox90', 'safari15'],
    legalComments: 'none',
    logLevel: 'warning',
  });
  return result.outputFiles[0].text.trim();
}

/** Inlines code into a raw-text element, refusing anything that would close it early. */
function inlineTag(tag, code) {
  if (new RegExp(`</${tag}`, 'i').test(code)) {
    throw new Error(`Inlined ${tag} contains "</${tag}", which would end the element early.`);
  }
  return `<${tag}>${code}</${tag}>`;
}

function inject(template, name, content) {
  const marker = `<!-- inject:${name} -->`;
  if (!template.includes(marker)) throw new Error(`src/index.html is missing ${marker}`);
  // A replacer function, so "$" sequences in the content are not treated as patterns.
  return template.replace(marker, () => content);
}

const [template, countries, styles, script] = await Promise.all([
  readFile(path.join(root, 'src', 'index.html'), 'utf8'),
  readCountries(),
  bundle('styles.css'),
  bundle('main.js'),
]);

const countryOptions = countries
  .map(({ code, name }) => `<option value="${escapeHtml(code)}">${escapeHtml(name)}</option>`)
  .join('\n              ');

// esbuild already emits ASCII-only JS and CSS, and character references would not be
// decoded inside <script> or <style>, so only the markup is converted.
let html = asciiOnly(inject(template, 'country-options', countryOptions));
html = inject(html, 'styles', inlineTag('style', styles));
html = inject(html, 'script', inlineTag('script', script));

if (/[^\x00-\x7f]/.test(html)) throw new Error('dist/index.html should be ASCII-only.');

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'index.html'), html);

console.log(`Built dist/index.html (${(Buffer.byteLength(html) / 1024).toFixed(1)} kB)`);
