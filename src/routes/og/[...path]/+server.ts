import { redirect } from '@sveltejs/kit';
import { SITE } from '$lib/site';

// Cards that exist in static/og are served before this runs. A page whose card hasn't been
// made yet (run `npm run og`) gets the default one instead of a broken image.
export const GET = () => redirect(302, SITE.image);
