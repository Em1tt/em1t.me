import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { isAuthor } from '$lib/server/author';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

// On the live domain, www and plain http both go to https://em1t.me.
const handleCanonical: Handle = ({ event, resolve }) => {
	const { hostname, protocol, pathname, search } = event.url;
	if (hostname === 'www.em1t.me' || (hostname === 'em1t.me' && protocol === 'http:')) {
		redirect(308, `https://em1t.me${pathname}${search}`);
	}
	return resolve(event);
};

// Signed in at /admin? Comments then post as Em1t (src/lib/server/comments.ts).
const handleAuthor: Handle = async ({ event, resolve }) => {
	event.locals.author = await isAuthor(event);
	return resolve(event);
};

export const handle: Handle = sequence(handleCanonical, handleAuthor, handleParaglide);
