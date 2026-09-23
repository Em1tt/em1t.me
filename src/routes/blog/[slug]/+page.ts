import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import type { PostMeta } from '$lib/posts';
import type { PageLoad } from './$types';

const modules = import.meta.glob<{ default: Component; metadata: Omit<PostMeta, 'slug'> }>(
	'/src/content/posts/*.svx'
);

export const load: PageLoad = async ({ params, data }) => {
	const module = modules[`/src/content/posts/${params.slug}.svx`];
	if (!module) error(404, 'There is no post here.');
	const post = await module();
	if (!post.metadata.published) error(404, 'There is no post here.');

	return { ...data, meta: { ...post.metadata, slug: params.slug } as PostMeta, Body: post.default };
};
