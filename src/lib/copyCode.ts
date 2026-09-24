import type { Attachment } from 'svelte/attachments';

/**
 * Makes the Copy buttons in highlighted code blocks work (the markup comes from the highlighter
 * in svelte.config.js). Attach to the element the post or case study renders into.
 */
export const copyCode: Attachment<HTMLElement> = (root) => {
	async function onClick(event: MouseEvent) {
		const button = (event.target as Element).closest<HTMLButtonElement>('.code-copy');
		const code = button?.closest('figure.code')?.querySelector('pre');
		if (!button || !code) return;

		try {
			await navigator.clipboard.writeText(code.innerText.replace(/\n$/, ''));
			flash(button, 'Copied');
		} catch {
			// No clipboard access: select the code so Ctrl+C / ⌘C copies it.
			getSelection()?.selectAllChildren(code);
			flash(button, 'Selected');
		}
	}

	root.addEventListener('click', onClick);
	return () => root.removeEventListener('click', onClick);
};

function flash(button: HTMLButtonElement, text: string) {
	button.textContent = text;
	button.dataset.done = '';
	clearTimeout(Number(button.dataset.timer));
	button.dataset.timer = String(
		setTimeout(() => {
			button.textContent = 'Copy';
			delete button.dataset.done;
		}, 1600)
	);
}
