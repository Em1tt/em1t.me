import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/semver.js';

test('parses a plain version', () => {
	assert.deepEqual(parse('1.2.3'), { major: 1, minor: 2, patch: 3, prerelease: [] });
});
