import { DISCORD_WEBHOOK, TURNSTILE_SECRET } from '$env/static/private';
import { validateToken } from '$lib';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	contact: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const subject = formData.get('subject') as string;
		const content = formData.get('content') as string;
		const turnstileRes = formData.get('cf-turnstile-response') as string;

        // Ensure the form fields are valid
        if (!name || !email || !content)
            return fail(400, {
                error: 'Please fill out all required fields.',
                validation: true
            });
		// Handle the form data (e.g., send an email, save to a database, etc.)

		const { success, error } = await validateToken(turnstileRes, TURNSTILE_SECRET);
		if (!success)
            return fail(400, {
                error: error || 'Invalid CAPTCHA',
                captcha: true
            });

		const fields = [
			{
				name: 'E-mail',
				value: email,
				inline: true
			}
		];
		if (name && typeof name == 'string' && name.trim())
			fields.unshift({
				name: 'Name',
				value: name,
				inline: true
			});
		if (subject && typeof subject == 'string' && subject.trim())
			fields.push({
				name: 'Subject',
				value: subject,
				inline: false
			});

		fields.push({
			name: 'Content',
			value: content,
			inline: false
		});

		const params = {
			content: '<@261465909321924609>',
			username: 'Em1t.me Contact Form',
			avatar_url: 'https://em1t.me/Bot.png',
			embeds: [
				{
					title: 'New message!',
					color: 5793266,
					fields
				}
			]
		};
		//CONTACT FORM SENDS DATA OVER TO DISCORD VIA WEBHOOKS.
		const res = await fetch(DISCORD_WEBHOOK, {
			method: 'POST',
			headers: {
				'Content-type': 'application/json'
			},
			body: JSON.stringify(params)
		});

		const result = await res.json().catch((e) => e);
		//Code exists only if request failed
        console.log(result);
		if (result?.code) return fail(500);

		// Return a success response
		return {
			success: true,
			message: 'Your message has been sent successfully!'
		};
	}
};

import type { Post } from '$lib/index'

export async function load({ fetch }) {
	const response = await fetch('/api/posts')
	const posts: Post[] = await response.json()
	return { posts }
}