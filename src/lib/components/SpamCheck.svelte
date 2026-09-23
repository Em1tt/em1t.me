<!--
	Cloudflare Turnstile. Stays invisible unless Cloudflare wants a click, and adds the
	cf-turnstile-response field the ?/contact action checks. Renders nothing until
	PUBLIC_TURNSTILE_SITE_KEY is set (see .env.example).
-->
<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { Turnstile } from 'svelte-turnstile';

	let { reset = $bindable() }: { reset?: () => void } = $props();
</script>

{#if env.PUBLIC_TURNSTILE_SITE_KEY}
	<Turnstile
		siteKey={env.PUBLIC_TURNSTILE_SITE_KEY}
		theme="dark"
		appearance="interaction-only"
		bind:reset
	/>
{/if}
