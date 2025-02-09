<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import '../app.css';
	import { Toaster } from 'svelte-5-french-toast';
	let { children } = $props();
</script>
<Toaster position="bottom-right" />
<ParaglideJS {i18n}>
	{@render children()}
</ParaglideJS>

<style lang="postcss">
	:global(.ibm-plex-mono-thin) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 100;
		font-style: normal;
	}

	:global(.ibm-plex-mono-extralight) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 200;
		font-style: normal;
	}

	:global(.ibm-plex-mono-light) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 300;
		font-style: normal;
	}

	:global(.ibm-plex-mono-regular) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 400;
		font-style: normal;
	}

	:global(.ibm-plex-mono-medium) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 500;
		font-style: normal;
	}

	:global(.ibm-plex-mono-semibold) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 600;
		font-style: normal;
	}

	:global(.ibm-plex-mono-bold) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 700;
		font-style: normal;
	}

	:global(.ibm-plex-mono-thin-italic) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 100;
		font-style: italic;
	}

	:global(.ibm-plex-mono-extralight-italic) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 200;
		font-style: italic;
	}

	:global(.ibm-plex-mono-light-italic) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 300;
		font-style: italic;
	}

	:global(.ibm-plex-mono-regular-italic) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 400;
		font-style: italic;
	}

	:global(.ibm-plex-mono-medium-italic) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 500;
		font-style: italic;
	}

	:global(.ibm-plex-mono-semibold-italic) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 600;
		font-style: italic;
	}

	:global(.ibm-plex-mono-bold-italic) {
		font-family: 'IBM Plex Mono', serif;
		font-weight: 700;
		font-style: italic;
	}
</style>
