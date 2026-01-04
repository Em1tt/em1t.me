import { DISCORD_WEBHOOK, TURNSTILE_SECRET } from '$env/static/private';
import { validateToken } from '$lib';
import type { Post } from '$lib/index';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export async function load({ fetch }) {
	const response = await fetch('/api/posts');
	const posts: Post[] = await response.json();
	return { posts };
}

export const actions: Actions = {
	contact: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const subject = formData.get('subject') as string;
		const content = formData.get('content') as string;
		const projectType = formData.get('project_type') as string;
		const turnstileRes = formData.get('cf-turnstile-response') as string;

		// Ensure the form fields are valid
		if (!name || !email || !content)
			return fail(400, {
				error: 'Please fill out all required fields.',
				validation: true
			});

		const { success, error } = await validateToken(turnstileRes, TURNSTILE_SECRET);
		/*if (!success)
			return fail(400, {
				error: error || 'Invalid CAPTCHA',
				captcha: true
			});
*/
		// Map project type to emoji and label
		const projectTypeMap: Record<string, string> = {
			website: '🌐 Website',
			webapp: '💻 Web App',
			design: '🎨 Design',
			consulting: '💡 Consulting',
			other: '✨ Other'
		};

		const params = {
			content: '<@261465909321924609>',
			username: 'Em1t.me Contact Form',
			avatar_url: 'https://em1t.me/Bot.png',
			embeds: [
				{
					title: '📬 New Contact Form Submission',
					color: 0xf97316, // Orange-500
					thumbnail: {
						url: 'https://em1t.me/misc/E1.svg'
					},
					fields: [
						{
							name: '👤 Name',
							value: name || 'Not provided',
							inline: true
						},
						{
							name: '📧 Email',
							value: email,
							inline: true
						},
						{
							name: '🏷️ Project Type',
							value: projectTypeMap[projectType] || '✨ Other',
							inline: true
						},
						...(subject
							? [
									{
										name: '📋 Subject',
										value: subject,
										inline: false
									}
								]
							: []),
						{
							name: '💬 Message',
							value: content.length > 1024 ? content.substring(0, 1021) + '...' : content,
							inline: false
						}
					],
					footer: {
						text: 'Sent from em1t.me/new',
						icon_url: 'https://em1t.me/misc/E1.svg'
					},
					timestamp: new Date().toISOString()
				}
			]
		};

		const res = await fetch(DISCORD_WEBHOOK, {
			method: 'POST',
			headers: {
				'Content-type': 'application/json'
			},
			body: JSON.stringify(params)
		});

		const result = await res.json().catch(() => ({}));
		console.log(result);
		if (result?.code) return fail(500);

		return {
			success: true,
			message: 'Your message has been sent successfully!'
		};
	}
};