<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { page } from '$app/state';
	
	let { children } = $props();
</script>

<svelte:head>
	<!-- Canonical URL -->
	<link rel="canonical" href="https://em1t.me{page.url.pathname}" />
	
	<!-- Robots -->
	<meta name="robots" content="index, follow" />
	
	<!-- Language -->
	<meta name="language" content="en" />
	
	<!-- Author -->
	<meta name="author" content="Richard Em1t" />
	
	<!-- Theme Color -->
	<meta name="theme-color" content="#0ea5e9" />
</svelte:head>

<Toaster position="bottom-right" />

{@render children()}

<style lang="postcss">
	:global(html) {
		overflow-x: hidden;
		scroll-behavior: smooth;
	}

	:global(.stack-sans-text){
		font-family: "Stack Sans Text", sans-serif;
		font-optical-sizing: auto;
	}
	
	:global(.stack-sans-headline){
		font-family: "Stack Sans Headline", sans-serif;
		font-optical-sizing: auto;
	}

	:global(.stack-sans-notch){
		font-family: "Stack Sans Notch", sans-serif;
		font-optical-sizing: auto;
	}
	
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
	:global(.domine-400) {
		font-family: 'Domine', serif;
		font-optical-sizing: auto;
		font-weight: 400;
		font-style: normal;
	}
	:global(.domine-500) {
		font-family: 'Domine', serif;
		font-optical-sizing: auto;
		font-weight: 500;
		font-style: normal;
	}
	:global(.domine-600) {
		font-family: 'Domine', serif;
		font-optical-sizing: auto;
		font-weight: 600;
		font-style: normal;
	}
	:global(.domine-700) {
		font-family: 'Domine', serif;
		font-optical-sizing: auto;
		font-weight: 700;
		font-style: normal;
	}
</style>
