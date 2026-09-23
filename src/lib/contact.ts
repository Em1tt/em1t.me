import type { SubmitFunction } from '@sveltejs/kit';

export const EMAIL = 'em1t.dev@proton.me';

export const contactLinks = [
	{ label: EMAIL, short: 'Email', href: `mailto:${EMAIL}` },
	{ label: 'github.com/Em1tt', short: 'GitHub', href: 'https://github.com/Em1tt' },
	{
		label: 'linkedin.com/in/richard-marcincak',
		short: 'LinkedIn',
		href: 'https://www.linkedin.com/in/richard-marcincak/'
	}
];

/** The same values the old form sent, so the ?/contact action maps them unchanged. */
export const projectTypes = [
	{ value: 'website', label: 'Website', phrase: 'a website' },
	{ value: 'webapp', label: 'Web app', phrase: 'a web app' },
	{ value: 'design', label: 'Design', phrase: 'some design work' },
	{ value: 'consulting', label: 'Consulting', phrase: 'a consultation' },
	{ value: 'other', label: 'Other', phrase: 'something else' }
];

export type SendState = { kind: 'idle' | 'sending' | 'sent' | 'error'; message: string };

/**
 * `use:enhance` handler shared by both contact layouts. `afterSend` runs whatever the outcome,
 * because a Turnstile token only works once.
 */
export function sendMessage(
	onState: (state: SendState) => void,
	afterSend: () => void
): SubmitFunction {
	return () => {
		onState({ kind: 'sending', message: 'Sending…' });
		return async ({ result, update }) => {
			if (result.type === 'success') {
				onState({ kind: 'sent', message: "Sent. Thanks, I'll reply by email." });
				await update();
			} else if (result.type === 'failure') {
				const error = result.data?.error;
				onState({
					kind: 'error',
					message: typeof error === 'string' ? error : `That didn't send. Email ${EMAIL} instead.`
				});
			} else {
				onState({ kind: 'error', message: `That didn't send. Email ${EMAIL} instead.` });
			}
			afterSend();
		};
	};
}
