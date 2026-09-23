import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import { caseStudies } from '$lib/projects';
import type { PageLoad } from './$types';

const bodies = import.meta.glob<{ default: Component }>('/src/content/work/*.svx');

export const load: PageLoad = async ({ params }) => {
	const index = caseStudies.findIndex((project) => project.slug === params.slug);
	const body = bodies[`/src/content/work/${params.slug}.svx`];
	if (index < 0 || !body) error(404, 'There is no case study here.');

	return {
		project: caseStudies[index],
		next: caseStudies[(index + 1) % caseStudies.length],
		position: index + 1,
		total: caseStudies.length,
		Body: (await body()).default
	};
};
