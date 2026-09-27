// Added after the benchmark; not part of any score. Run: node extra/lost-click.mjs
//
// Opus 5.5 found this bug in its own F2 sign-up form and fixed it: you type something invalid into
// a field, then press the submit button. The press takes focus from the field, the field's error
// appears, the error pushes the button down, and when you let go the pointer is no longer on the
// button, so there's no click and no submit. This checks both models' built forms for it, with real
// mouse events: for points down the submit button, 4 px apart, it types "ab" into the username field,
// presses and releases the mouse on that point, and reports where the press didn't submit the form.
import { fileURLToPath } from 'node:url';
import { serve, browser, sleep } from '../tools/harness.mjs';

const RESULTS = fileURLToPath(new URL('../results/f2-signup-form/', import.meta.url));

for (const model of ['claude', 'codex']) {
	const site = await serve(`${RESULTS}${model}/workspace/dist`);
	const tab = await browser();
	await tab.size(1280, 900);
	const rect = (selector) =>
		tab.ev(`(() => { const r = document.querySelector('${selector}').getBoundingClientRect(); return { x: r.left + r.width / 2, top: r.top, height: r.height }; })()`);
	const mouse = (type, x, y) => tab.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
	const lost = [];
	let height = 0;
	let moved = 0;
	for (let offset = 2; ; offset += 4) {
		await tab.go(site.url + '/', 600);
		await tab.ev(`document.querySelector('[data-testid="submit"]').scrollIntoView({ block: 'center' }), true`);
		await sleep(100);
		const field = await rect('#username');
		await mouse('mousePressed', field.x, field.top + field.height / 2);
		await mouse('mouseReleased', field.x, field.top + field.height / 2);
		await tab.send('Input.insertText', { text: 'ab' });
		await sleep(100);
		const button = await rect('[data-testid="submit"]');
		height = button.height;
		if (offset >= button.height) break;
		await mouse('mousePressed', button.x, button.top + offset);
		await sleep(100);
		moved = Math.round((await rect('[data-testid="submit"]')).top - button.top);
		await mouse('mouseReleased', button.x, button.top + offset);
		await sleep(250);
		// A submit shows every field's error, so the email field's error is no longer empty.
		const submitted = await tab.ev(`document.querySelector('[data-testid="error-email"]').textContent.trim() !== ''`);
		if (!submitted) lost.push(offset);
	}
	console.log(
		`${model === 'claude' ? 'Opus 5.5' : 'GPT-6 Astra'}: the ${Math.round(height)} px button moves ${moved} px while pressed;`,
		lost.length ? `presses ${lost[0]}–${lost.at(-1)} px from its top edge don't submit` : 'every press submits'
	);
	tab.close();
	site.close();
}
process.exit(0);
