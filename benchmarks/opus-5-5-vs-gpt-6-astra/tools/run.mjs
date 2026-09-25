// Runs one model on one task, then scores it. Usage: node run.mjs <task> <claude|codex>
// The workspace is a fresh copy of the task's template in a short path, as a git repository; the
// agent gets the same prompt either way, with the same tools and no help. Afterwards the work is
// archived (without node_modules) and scored by the task's hidden tests.
//
// A subscription usage limit isn't the model's fault: if one cuts a run short, the run is thrown
// away (its log kept as limited-attempt-N.jsonl), and done again from scratch once the limit ends.
import { spawn, spawnSync, execSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, openSync, rmSync, writeFileSync, readFileSync, closeSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , task, model] = process.argv;
const KIT = fileURLToPath(new URL('..', import.meta.url));
const WORK = `C:/Users/marci/AppData/Local/Temp/bench/w/${task}-${model}`;
const RESULT = join(KIT, 'results', task, model);
const LIMIT_MS = 60 * 60 * 1000;
const GATE = join(KIT, 'tools', `${model}-limited-until.txt`);
const CLAUDE = 'C:/Users/marci/.vscode/extensions/anthropic.claude-code-2.1.281-win32-x64/resources/native-binary/claude.exe';
export const PROMPT =
	"This folder contains TASK.md, and for some tasks starter files. Read TASK.md and complete the task it describes. Work only inside this folder. You can install npm packages. Nobody will answer questions while you work, so make your own decisions, and finish the whole task. When you're done, reply with a short summary of what you did.";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Anything the agent left running in its folder (dev servers, watchers) is stopped, so it can't
// hold ports or files for the scoring or the next run.
function cleanup() {
	const needle = WORK.replaceAll('/', String.fromCharCode(92));
	spawnSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine.Contains('${needle}') -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' });
}
const limited = (text) => /hit your usage limit|usage limit reached|hit your limit|"status":"rejected"/i.test(text);
// When the limit ends, from the tool's own message; an hour from now if it doesn't say.
function limitEnds(text) {
	const codex = /try again at (\d{1,2}):(\d{2})\s*([AP]M)/i.exec(text);
	if (codex) {
		const d = new Date();
		d.setHours((Number(codex[1]) % 12) + (codex[3].toUpperCase() === 'PM' ? 12 : 0), Number(codex[2]), 0, 0);
		if (d.getTime() < Date.now() - 60000) d.setDate(d.getDate() + 1);
		return d.getTime();
	}
	const rejected = [...text.matchAll(/"status":"rejected"[^\n]*?"resetsAt":(\d{10})/g)].at(-1);
	if (rejected) return Number(rejected[1]) * 1000;
	return Date.now() + 60 * 60 * 1000;
}

rmSync(RESULT, { recursive: true, force: true });
mkdirSync(RESULT, { recursive: true });
const commands = {
	claude: [CLAUDE, ['-p', PROMPT, '--model', 'claude-opus-5-5', '--effort', 'max', '--setting-sources', 'project', '--strict-mcp-config', '--dangerously-skip-permissions', '--output-format', 'stream-json', '--verbose']],
	codex: ['codex', ['exec', '--ignore-user-config', '--ignore-rules', '-m', 'gpt-6-astra', '-c', 'model_reasoning_effort=ultra', '--dangerously-bypass-approvals-and-sandbox', '--skip-git-repo-check', '-C', WORK, '--json', '-']]
};
const [command, args] = commands[model];

let attempt = 0;
let code;
let started;
let seconds;
let timedOut;
for (;;) {
	attempt++;
	const until = existsSync(GATE) ? Number(readFileSync(GATE, 'utf8')) : 0;
	if (until > Date.now()) {
		console.error(`${task} ${model}: waiting for the usage limit to end at ${new Date(until).toLocaleTimeString()}`);
		await sleep(until - Date.now() + 2 * 60 * 1000);
	}
	cleanup();
	rmSync(WORK, { recursive: true, force: true });
	mkdirSync(WORK, { recursive: true });
	cpSync(join(KIT, 'tasks', task, 'template'), WORK, { recursive: true });
	const git = (...a) => execSync(`git -c user.name=bench -c user.email=bench@example.com ${a.join(' ')}`, { cwd: WORK, stdio: 'ignore' });
	git('init', '-q');
	git('add', '-A');
	git('commit', '-q', '-m', '"Task template"');

	const log = openSync(join(RESULT, 'log.jsonl'), 'w');
	const errors = openSync(join(RESULT, 'stderr.txt'), 'w');
	started = Date.now();
	// Codex goes through the shell (it's a script shim), so its prompt goes in on stdin, unquoted.
	const child = spawn(command, args, { cwd: WORK, stdio: [model === 'codex' ? 'pipe' : 'ignore', log, errors], shell: model === 'codex', env: { ...process.env } });
	if (model === 'codex') child.stdin.end(PROMPT);
	timedOut = false;
	const timer = setTimeout(() => {
		timedOut = true;
		try {
			execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' });
		} catch {
			// Already gone.
		}
	}, LIMIT_MS);
	code = await new Promise((resolve) => child.on('exit', resolve));
	clearTimeout(timer);
	closeSync(log);
	closeSync(errors);
	seconds = (Date.now() - started) / 1000;
	cleanup();

	const text = readFileSync(join(RESULT, 'log.jsonl'), 'utf8') + readFileSync(join(RESULT, 'stderr.txt'), 'utf8');
	if (limited(text) && attempt < 6) {
		copyFileSync(join(RESULT, 'log.jsonl'), join(RESULT, `limited-attempt-${attempt}.jsonl`));
		writeFileSync(GATE, String(limitEnds(text)));
		console.error(`${task} ${model}: attempt ${attempt} hit a usage limit after ${(seconds / 60).toFixed(1)} min; retrying later`);
		continue;
	}
	break;
}

// Token use, from each tool's own event log.
const events = readFileSync(join(RESULT, 'log.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
let usage = {};
let summary = '';
if (model === 'claude') {
	const result = events.findLast((e) => e.type === 'result');
	usage = { input: result?.usage?.input_tokens, cacheRead: result?.usage?.cache_read_input_tokens, cacheWrite: result?.usage?.cache_creation_input_tokens, output: result?.usage?.output_tokens, turns: result?.num_turns, apiSeconds: result?.duration_api_ms / 1000, costUsd: result?.total_cost_usd, models: Object.keys(result?.modelUsage ?? {}) };
	summary = result?.result ?? '';
} else {
	const turns = events.filter((e) => e.type === 'turn.completed');
	const sum = (k) => turns.reduce((n, t) => n + (t.usage?.[k] ?? 0), 0);
	usage = { input: sum('input_tokens'), cacheRead: sum('cached_input_tokens'), output: sum('output_tokens'), reasoning: sum('reasoning_output_tokens'), turns: turns.length, commands: events.filter((e) => e.item?.type === 'command_execution' && e.type === 'item.completed').length };
	summary = events.filter((e) => e.item?.type === 'agent_message').at(-1)?.item?.text ?? '';
}
writeFileSync(join(RESULT, 'summary.txt'), summary);

// What changed, and an archive of the work without dependencies.
try {
	execSync('git -c core.autocrlf=false add -A', { cwd: WORK, stdio: 'ignore' });
	const stat = execSync('git diff --cached --stat HEAD', { cwd: WORK, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
	writeFileSync(join(RESULT, 'diffstat.txt'), stat);
} catch {
	// No git changes to report.
}
cpSync(WORK, join(RESULT, 'workspace'), { recursive: true, filter: (p) => !/[\\/](node_modules|\.git)([\\/]|$)/.test(p) });

// Score with the hidden tests, against the live workspace (with its node_modules).
const score = spawnSync(process.execPath, [join(KIT, 'tasks', task, 'hidden', 'test.mjs'), WORK, join(RESULT, 'score')], { cwd: join(KIT, 'tasks', task, 'hidden'), encoding: 'utf8', timeout: 20 * 60 * 1000 });
const scored = existsSync(join(RESULT, 'score', 'result.json')) ? JSON.parse(readFileSync(join(RESULT, 'score', 'result.json'), 'utf8')) : { passed: 0, total: 0, note: score.stderr?.slice(0, 500) };
const meta = { task, model, started: new Date(started).toISOString(), seconds, exitCode: code, timedOut, limitedAttempts: attempt - 1, usage, score: { passed: scored.passed, total: scored.total, note: scored.note } };
writeFileSync(join(RESULT, 'meta.json'), JSON.stringify(meta, null, 2));
console.log(`${task} ${model}: ${scored.passed}/${scored.total} in ${(seconds / 60).toFixed(1)} min${timedOut ? ' (TIMED OUT)' : ''}${attempt > 1 ? ` (after ${attempt - 1} limited attempts)` : ''}`);
cleanup();
rmSync(WORK, { recursive: true, force: true });
