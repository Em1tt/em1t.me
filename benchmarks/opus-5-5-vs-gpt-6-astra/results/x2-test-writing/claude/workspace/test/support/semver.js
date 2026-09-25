// src/semver.js, with a limit on how long each call may run.
//
// A bug in a loop (in compare(), say) can make a call run forever. Called directly, that would hang
// the whole test run instead of failing it. Called through here, a call that has used a second of
// CPU time throws instead, and so does every later call, so each test file fails quickly and the
// run finishes. Otherwise the functions behave exactly like the originals: same arguments, results
// and errors.
//
// The limit counts CPU time, not wall-clock time, so that a busy machine can't trip it: the real
// calls need microseconds.

import vm from 'node:vm';
import { inspect } from 'node:util';
import * as semver from '../../src/semver.js';

const CPU_LIMIT_MS = 1000;
const ATTEMPT_MS = 100;

const context = vm.createContext({});
const call = new vm.Script('fn(...args)');
let hung = null;

function limited(fn) {
	return (...args) => {
		if (hung) throw new Error(`${hung} never returned, so no more calls are made`);
		Object.assign(context, { fn, args });
		// Each attempt may run for ATTEMPT_MS of wall-clock time. One that runs out is started again
		// (the functions are pure), until the attempts have used up CPU_LIMIT_MS of CPU time.
		for (let cpuMs = 0; cpuMs < CPU_LIMIT_MS; ) {
			const before = process.cpuUsage();
			try {
				return call.runInContext(context, { timeout: ATTEMPT_MS });
			} catch (error) {
				if (error?.code !== 'ERR_SCRIPT_EXECUTION_TIMEOUT') throw error;
			}
			const used = process.cpuUsage(before);
			cpuMs += (used.user + used.system) / 1000;
		}
		hung = `${fn.name}(${args.map((arg) => inspect(arg)).join(', ')})`;
		throw new Error(`${hung} did not return within ${CPU_LIMIT_MS} ms of CPU time`);
	};
}

export const parse = limited(semver.parse);
export const compare = limited(semver.compare);
export const satisfies = limited(semver.satisfies);
export const maxSatisfying = limited(semver.maxSatisfying);
