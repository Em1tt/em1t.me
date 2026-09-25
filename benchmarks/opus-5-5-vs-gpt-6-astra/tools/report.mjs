// Collects every run's numbers into results/summary.json. Usage: node report.mjs
// Tokens come from each tool's own log: for Claude Code, the last result event's modelUsage (which
// adds up the whole session, sub-agents included); for Codex, the sum of its turn.completed events.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = fileURLToPath(new URL('..', import.meta.url));
const RESULTS = join(KIT, 'results');
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const events = (p) =>
	read(p)
		.split('\n')
		.filter(Boolean)
		.map((l) => {
			try {
				return JSON.parse(l);
			} catch {
				return null;
			}
		})
		.filter(Boolean);

function claude(dir) {
	const log = events(join(dir, 'log.jsonl'));
	const result = log.findLast((e) => e.type === 'result') ?? {};
	const opus = result.modelUsage?.['claude-opus-5-5'] ?? {};
	const others = Object.entries(result.modelUsage ?? {}).filter(([m]) => m !== 'claude-opus-5-5');
	const tools = {};
	const subagentDetails = [];
	// Tool calls by the main agent only, as for Codex, whose exec log leaves out its sub-agents'.
	for (const e of log) {
		if (e.type !== 'assistant' || e.parent_tool_use_id) continue;
		for (const block of e.message?.content ?? []) {
			if (block.type !== 'tool_use') continue;
			tools[block.name] = (tools[block.name] ?? 0) + 1;
			if (block.name === 'Agent' || block.name === 'Task') subagentDetails.push({ description: block.input?.description, type: block.input?.subagent_type, model: block.input?.model });
		}
	}
	return {
		input: (opus.inputTokens ?? 0) + (opus.cacheReadInputTokens ?? 0) + (opus.cacheCreationInputTokens ?? 0),
		cached: opus.cacheReadInputTokens ?? 0,
		output: opus.outputTokens ?? 0,
		reasoning: opus.thinkingTokens ?? 0,
		helpers: Object.fromEntries(others.map(([m, u]) => [m, { input: u.inputTokens + u.cacheReadInputTokens + u.cacheCreationInputTokens, output: u.outputTokens }])),
		subagents: result.subagent_stats?.spawned ?? 0,
		subagentDetails,
		turns: log.filter((e) => e.type === 'result').reduce((n, r) => n + (r.num_turns ?? 0), 0),
		toolCalls: Object.values(tools).reduce((a, b) => a + b, 0),
		tools
	};
}

// At "ultra" effort, Codex hands parts of a task to sub-agents. Their tokens aren't in the exec
// log, only in each sub-agent's own session file under ~/.codex/sessions, which names its parent.
const SESSIONS = join(homedir(), '.codex', 'sessions');
const sessions = readdirSync(SESSIONS, { recursive: true })
	.filter((f) => f.endsWith('.jsonl'))
	.map((f) => {
		const log = events(join(SESSIONS, f));
		const spawn = log.find((e) => e.type === 'session_meta')?.payload?.source?.subagent?.thread_spawn;
		const usage = log.findLast((e) => e.payload?.type === 'token_count' && e.payload.info)?.payload.info.total_token_usage;
		const model = log.find((e) => e.type === 'turn_context')?.payload;
		return { id: log.find((e) => e.type === 'session_meta')?.payload?.id, parent: spawn?.parent_thread_id, name: spawn?.agent_nickname, path: spawn?.agent_path, model: model?.model, effort: model?.effort, usage };
	});

function codex(dir) {
	const log = events(join(dir, 'log.jsonl'));
	const turns = log.filter((e) => e.type === 'turn.completed');
	const sum = (k) => turns.reduce((n, t) => n + (t.usage?.[k] ?? 0), 0);
	const done = log.filter((e) => e.type === 'item.completed');
	const count = (type) => done.filter((e) => e.item?.type === type).length;
	const tools = { command: count('command_execution'), fileChange: count('file_change'), webSearch: count('web_search'), mcp: count('mcp_tool_call') };
	const root = log.find((e) => e.type === 'thread.started')?.thread_id;
	const subagents = [];
	for (let parents = [root]; parents.length; ) {
		const children = sessions.filter((s) => s.parent && parents.includes(s.parent));
		subagents.push(...children);
		parents = children.map((s) => s.id);
	}
	const sub = (k) => subagents.reduce((n, s) => n + (s.usage?.[k] ?? 0), 0);
	return {
		input: sum('input_tokens') + sub('input_tokens'),
		cached: sum('cached_input_tokens') + sub('cached_input_tokens'),
		output: sum('output_tokens') + sub('output_tokens'),
		reasoning: sum('reasoning_output_tokens') + sub('reasoning_output_tokens'),
		mainAgent: { input: sum('input_tokens'), output: sum('output_tokens') },
		subagents: subagents.length,
		subagentDetails: subagents.map((s) => ({ name: s.name, path: s.path, model: s.model, effort: s.effort, input: s.usage?.input_tokens, output: s.usage?.output_tokens })),
		turns: turns.length,
		messages: count('agent_message'),
		toolCalls: Object.values(tools).reduce((a, b) => a + b, 0),
		tools
	};
}

const rows = [];
for (const task of readdirSync(RESULTS).sort()) {
	for (const model of ['claude', 'codex']) {
		const dir = join(RESULTS, task, model);
		if (!existsSync(join(dir, 'meta.json'))) continue;
		const meta = JSON.parse(read(join(dir, 'meta.json')));
		// A rescore (after a fix to the tests) lives in score-v2 and replaces the first score.
		const rescored = existsSync(join(dir, 'score-v2', 'result.json')) ? JSON.parse(read(join(dir, 'score-v2', 'result.json'))) : null;
		const score = JSON.parse(read(join(dir, rescored ? 'score-v2' : 'score', 'result.json')) || '{}');
		const failed = (score.results ?? []).filter((r) => !r.ok).map((r) => r.name);
		rows.push({
			task,
			model,
			minutes: Math.round(meta.seconds / 6) / 10,
			timedOut: meta.timedOut,
			limitedAttempts: meta.limitedAttempts ?? 0,
			passed: score.passed,
			total: score.total,
			failed,
			firstScore: rescored ? JSON.parse(read(join(dir, 'score', 'result.json'))).passed : undefined,
			extra: score.extra,
			...(model === 'claude' ? claude(dir) : codex(dir))
		});
	}
}
writeFileSync(join(RESULTS, 'summary.json'), JSON.stringify(rows, null, 2));
const m = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1e3)}k`);
for (const r of rows) {
	console.log(`${r.task.padEnd(18)} ${r.model.padEnd(7)} ${String(r.passed).padStart(2)}/${String(r.total).padEnd(2)} ${String(r.minutes).padStart(5)} min  in ${m(r.input).padStart(6)} (cached ${m(r.cached).padStart(6)})  out ${m(r.output).padStart(5)} (reasoning ${m(r.reasoning).padStart(5)})  ${String(r.toolCalls).padStart(3)} tool calls  ${r.subagents ? r.subagents + ' subagents' : ''}${r.failed.length ? '  FAILED: ' + r.failed.join('; ') : ''}`);
}
