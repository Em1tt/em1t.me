// Builds the static site from src/ into dist/.
//
// - CSS, JS and fonts are fingerprinted into dist/assets/ so they can be cached forever.
// - References in the HTML and CSS are rewritten to the fingerprinted names.
// - Comments are stripped and whitespace runs collapsed to a single space, so the
//   text content of the page is unchanged.
// - The output is checked: every local reference must exist and nothing may be
//   loaded from another server.
//
// No dependencies: runs with plain Node.js 18+.

import { createHash } from "node:crypto";
import { access, copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");
const distDir = path.join(root, "dist");

/** Source path (relative to src/) -> output path (relative to dist/). */
const assetMap = new Map();

const shortHash = (content) => createHash("sha256").update(content).digest("hex").slice(0, 10);

async function emitAsset(sourcePath, content) {
  const { name, ext } = path.posix.parse(sourcePath);
  const outputPath = `assets/${name}.${shortHash(content)}${ext}`;
  await writeFile(path.join(distDir, outputPath), content);
  assetMap.set(sourcePath, outputPath);
  return outputPath;
}

const isExternal = (ref) => /^([a-z][a-z0-9+.-]*:)?\/\//i.test(ref);
const isLocalFile = (ref) => !isExternal(ref) && !/^(#|data:|mailto:|tel:|javascript:)/i.test(ref);

function rewriteCssUrls(css) {
  return css.replace(/url\(\s*(["']?)(.*?)\1\s*\)/g, (match, _quote, ref) => {
    if (!isLocalFile(ref)) return match;
    const output = assetMap.get(path.posix.normalize(ref));
    if (!output) throw new Error(`styles.css references a file that is not an asset: ${ref}`);
    return `url("${path.posix.relative("assets", output)}")`;
  });
}

function minifyCss(css) {
  const strings = [];
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, (s) => `\u0000${strings.push(s) - 1}\u0000`)
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .replace(/\u0000(\d+)\u0000/g, (_, i) => strings[Number(i)])
    .trim();
}

function rewriteHtmlRefs(html) {
  return html.replace(/\b(href|src)="([^"]*)"/g, (match, attr, ref) => {
    const output = assetMap.get(ref);
    return output ? `${attr}="${output}"` : match;
  });
}

function minifyHtml(html) {
  const preserved = [];
  return (
    html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(script|style|pre|textarea)\b[\s\S]*?<\/\1>/gi, (block) => `\u0000${preserved.push(block) - 1}\u0000`)
      // Only ASCII whitespace: a no-break space is content, not formatting.
      .replace(/[ \t\r\n]+/g, " ")
      .replace(/\u0000(\d+)\u0000/g, (_, i) => preserved[Number(i)])
      .trim() + "\n"
  );
}

async function verify(html, css) {
  const refs = [
    ...[...html.matchAll(/\b(?:href|src)="([^"]*)"/g)].map((m) => ({ ref: m[1], from: "" })),
    ...[...css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/g)].map((m) => ({ ref: m[2], from: "assets" })),
  ];
  for (const { ref, from } of refs) {
    if (isExternal(ref)) throw new Error(`External resource found in the build: ${ref}`);
    if (!isLocalFile(ref)) continue;
    const file = path.join(distDir, from, ref.split(/[?#]/)[0]);
    await access(file).catch(() => {
      throw new Error(`Broken reference in the build: ${ref}`);
    });
  }
}

async function main() {
  const started = performance.now();
  await rm(distDir, { recursive: true, force: true });
  await mkdir(path.join(distDir, "assets"), { recursive: true });

  for (const file of await readdir(path.join(srcDir, "fonts"))) {
    if (file.endsWith(".woff2")) {
      await emitAsset(`fonts/${file}`, await readFile(path.join(srcDir, "fonts", file)));
    }
  }
  await copyFile(path.join(srcDir, "fonts", "Fraunces-OFL.txt"), path.join(distDir, "assets", "Fraunces-OFL.txt"));

  const css = minifyCss(rewriteCssUrls(await readFile(path.join(srcDir, "styles.css"), "utf8")));
  await emitAsset("styles.css", css);
  await emitAsset("main.js", await readFile(path.join(srcDir, "main.js"), "utf8"));

  const html = minifyHtml(rewriteHtmlRefs(await readFile(path.join(srcDir, "index.html"), "utf8")));
  await writeFile(path.join(distDir, "index.html"), html);
  await copyFile(path.join(srcDir, "favicon.svg"), path.join(distDir, "favicon.svg"));

  await verify(html, css);

  const outputs = ["index.html", "favicon.svg", ...assetMap.values()];
  const rows = await Promise.all(
    outputs.map(async (file) => {
      const { size } = await stat(path.join(distDir, file));
      return `  dist/${file.padEnd(44)} ${(size / 1024).toFixed(1).padStart(6)} kB`;
    }),
  );
  console.log(`Built Tidepool in ${Math.round(performance.now() - started)} ms\n${rows.join("\n")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
