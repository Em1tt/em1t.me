import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import { caseStudies, projects } from '$lib/projects';
import type { PageLoad } from './$types';

const bodies = import.meta.glob<{ default: Component }>('/src/content/work/*.svx');

export const load: PageLoad = async ({ params }) => {
	const project = projects.find(
		(project) => project.slug === params.slug && (project.caseStudy || project.page)
	);
	const body = bodies[`/src/content/work/${params.slug}.svx`];
	if (!project || !body) error(404, 'There is no case study here.');

	// Pages without a plate aren't numbered, and lead on to the first case study.
	const index = caseStudies.indexOf(project);
	return {
		project,
		next: caseStudies[(index + 1) % caseStudies.length],
		position: index >= 0 ? index + 1 : undefined,
		total: caseStudies.length,
		Body: (await body()).default
	};
};
