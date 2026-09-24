import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import type { PageLoad } from './$types';

const modules = import.meta.glob<{ default: Component }>('/src/content/posts/*/*.svx');

export const load: PageLoad = async ({ params, data }) => {
	const module = modules[`/src/content/posts/${params.slug}/${params.chapter}.svx`];
	if (!module) error(404, 'There is no chapter here.');
	return { ...data, Body: (await module()).default };
};
