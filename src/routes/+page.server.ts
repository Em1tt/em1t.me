import { env } from '$env/dynamic/private';
import { EMAIL } from '$lib/contact';
import { featuredPost, posts } from '$lib/server/posts';
import { validateToken } from '$lib/server/turnstile';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	featuredPost,
	morePosts: posts.filter((post) => post !== featuredPost).slice(0, 2)
});

const projectTypeMap: Record<string, string> = {
	website: '🌐 Website',
	webapp: '💻 Web App',
	design: '🎨 Design',
	consulting: '💡 Consulting',
	other: '✨ Other'
};

export const actions: Actions = {
	contact: async ({ request }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const email = String(formData.get('email') ?? '').trim();
		const subject = String(formData.get('subject') ?? '').trim();
		const content = String(formData.get('content') ?? '').trim();
		const projectType = String(formData.get('project_type') ?? '');
		const turnstileRes = String(formData.get('cf-turnstile-response') ?? '');

		if (!name || !email || !content) {
			return fail(400, { error: 'Fill in your name, email and message, then send it again.' });
		}

		// Read at request time, so a missing .env can't break the build (see .env.example).
		if (!env.DISCORD_WEBHOOK || !env.TURNSTILE_SECRET) {
			return fail(503, { error: `The form isn't connected yet. Email ${EMAIL} instead.` });
		}

		const { success, error } = await validateToken(turnstileRes, env.TURNSTILE_SECRET);
		if (!success) {
			return fail(400, {
				error: `The spam check didn't pass${error ? ` (${error})` : ''}. Reload the page and try again.`
			});
		}

		const params = {
			content: '<@261465909321924609>',
			username: 'Em1t.me Contact Form',
			avatar_url: 'https://em1t.me/Bot.png',
			embeds: [
				{
					title: '📬 New Contact Form Submission',
					color: 0xf97316,
					thumbnail: { url: 'https://em1t.me/E1.svg' },
					fields: [
						{ name: '👤 Name', value: name, inline: true },
						{ name: '📧 Email', value: email, inline: true },
						{
							name: '🏷️ Project Type',
							value: projectTypeMap[projectType] || '✨ Other',
							inline: true
						},
						...(subject ? [{ name: '📋 Subject', value: subject, inline: false }] : []),
						{
							name: '💬 Message',
							value: content.length > 1024 ? content.substring(0, 1021) + '...' : content,
							inline: false
						}
					],
					footer: { text: 'Sent from em1t.me', icon_url: 'https://em1t.me/E1.svg' },
					timestamp: new Date().toISOString()
				}
			]
		};

		const res = await fetch(env.DISCORD_WEBHOOK, {
			method: 'POST',
			headers: { 'Content-type': 'application/json' },
			body: JSON.stringify(params)
		});

		if (!res.ok) {
			return fail(502, { error: `Your message didn't go through. Email ${EMAIL} instead.` });
		}

		return { success: true };
	}
};
