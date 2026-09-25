// Blind design judging for the frontend tasks. Usage: node judge.mjs <task> <claude|codex>
// The judge sees two pages, A and B, as desktop and phone screenshots, without knowing which model
// made which, and picks the better-looking one. It judges twice, with A and B swapped, so a
// preference for whichever comes first shows up as a disagreement.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , task, judge] = process.argv;
const KIT = fileURLToPath(new URL('..', import.meta.url));
const CLAUDE = 'C:/Users/marci/.vscode/extensions/anthropic.claude-code-2.1.281-win32-x64/resources/native-binary/claude.exe';
const shots = (model, kind) => join(KIT, 'results', task, model, 'score', `${kind}.png`);
const PROMPT =
	'You are judging the visual design of two web pages, A and B, built from the same written brief. The images are a-desktop.png and a-mobile.png (page A), and b-desktop.png and b-mobile.png (page B), in this folder. Look at all four. Judge only what you can see: layout, typography, colour, spacing, visual polish, and how well each works on a phone. Reply with one line: the letter A or B, then a colon and one sentence saying why.';

const verdicts = [];
for (const [a, b] of [['claude', 'codex'], ['codex', 'claude']]) {
	const dir = `C:/Users/marci/AppData/Local/Temp/bench/judge/${task}-${judge}-${a}`;
	rmSync(dir, { recursive: true, force: true });
	mkdirSync(dir, { recursive: true });
	for (const [letter, model] of [['a', a], ['b', b]]) {
		for (const kind of ['desktop', 'mobile']) {
			if (existsSync(shots(model, kind))) copyFileSync(shots(model, kind), join(dir, `${letter}-${kind}.png`));
		}
	}
	const images = ['a-desktop.png', 'a-mobile.png', 'b-desktop.png', 'b-mobile.png'].filter((f) => existsSync(join(dir, f)));
	const r =
		judge === 'claude'
			? spawnSync(CLAUDE, ['-p', PROMPT, '--model', 'claude-opus-5-5', '--effort', 'max', '--setting-sources', 'project', '--strict-mcp-config', '--dangerously-skip-permissions', '--output-format', 'json'], { cwd: dir, encoding: 'utf8', timeout: 15 * 60 * 1000 })
			: spawnSync(`codex exec --ignore-user-config --ignore-rules -m gpt-6-astra -c model_reasoning_effort=ultra --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check ${images.map((f) => `-i ${f}`).join(' ')} -o verdict.txt -`, { cwd: dir, shell: true, input: PROMPT, encoding: 'utf8', timeout: 15 * 60 * 1000 });
	let text = '';
	if (judge === 'claude') {
		try {
			text = JSON.parse(r.stdout).result ?? '';
		} catch {
			text = r.stdout ?? '';
		}
	} else {
		try {
			text = (await import('node:fs')).readFileSync(join(dir, 'verdict.txt'), 'utf8');
		} catch {
			text = r.stdout ?? '';
		}
	}
	const letter = (/\b([AB])\b\s*:/.exec(text) ?? /^\s*\**([AB])\b/m.exec(text))?.[1];
	verdicts.push({ order: `A=${a}, B=${b}`, pick: letter ? (letter === 'A' ? a : b) : null, text: text.trim().slice(0, 600) });
	rmSync(dir, { recursive: true, force: true });
}
const out = join(KIT, 'results', task, `judge-${judge}.json`);
writeFileSync(out, JSON.stringify(verdicts, null, 2));
console.log(`${task} judged by ${judge}: ${verdicts.map((v) => v.pick).join(', ')}`);
