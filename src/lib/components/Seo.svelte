<!--
	Title, description, canonical URL, Open Graph and Twitter card tags, and optional structured
	data, for one page. `title` is the browser tab; `heading` is what social cards show.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { deLocalizeUrl } from '$lib/paraglide/runtime';
	import { SITE } from '$lib/site';

	type Props = {
		title: string;
		heading?: string;
		description: string;
		image?: string;
		imageAlt?: string;
		type?: 'website' | 'article';
		/** 'YYYY-MM-DD', for articles. */
		published?: string;
		jsonLd?: object;
	};

	let {
		title,
		heading = title,
		description,
		image = SITE.image,
		imageAlt = SITE.imageAlt,
		type = 'website',
		published,
		jsonLd
	}: Props = $props();

	// One address per page: the /sk/… copies and any query string point back at the original.
	const canonical = $derived(SITE.url + deLocalizeUrl(page.url).pathname);
	const imageUrl = $derived(new URL(image, SITE.url).href);
	// `<` is escaped so text in the data can't close the script tag early.
	const structured = $derived(
		jsonLd
			? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</` +
					'script>'
			: ''
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:locale" content={SITE.locale} />
	<meta property="og:url" content={canonical} />
	<meta property="og:title" content={heading} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={imageAlt} />
	{#if published}
		<meta property="article:published_time" content={published} />
		<meta property="article:author" content={SITE.author} />
	{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={heading} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
	<meta name="twitter:image:alt" content={imageAlt} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON built here, with < escaped -->
	{@html structured}
</svelte:head>
