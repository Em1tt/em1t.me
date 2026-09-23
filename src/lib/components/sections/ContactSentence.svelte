<script lang="ts">
	import { enhance } from '$app/forms';
	import SpamCheck from '$lib/components/SpamCheck.svelte';
	import { contactLinks, projectTypes, sendMessage, type SendState } from '$lib/contact';

	let status = $state<SendState>({ kind: 'idle', message: '' });
	let resetSpamCheck = $state<() => void>();

	const strip = 'bg-[#05030f] box-decoration-clone px-[0.3em] py-[0.12em]';
	const blank =
		'rounded-none border-0 border-b-2 border-[#ff5640] bg-[#05030f] px-[0.25em] py-[0.02em] text-[#ff5640] [font:inherit] [letter-spacing:inherit] placeholder:text-[#ff5640]/45 focus:bg-[#120a14] focus:outline-none';
</script>

<form
	method="POST"
	action="?/contact"
	class="grid cursor-auto content-center gap-5.5"
	use:enhance={sendMessage(
		(next) => (status = next),
		() => resetSpamCheck?.()
	)}
>
	<h2 class="sr-only">Contact</h2>
	<p
		class="google-sans-400 max-w-[21em] text-[clamp(26px,3.1vw,56px)] leading-[1.72] tracking-[-0.015em]"
	>
		<span class={strip}>Hi Richard, I'm</span>
		<input
			id="contact-name"
			name="name"
			autocomplete="name"
			placeholder="your name"
			aria-label="Your name"
			required
			class="{blank} w-[7.5em]"
		/><span class={strip}>and I need</span>
		<select
			id="contact-type"
			name="project_type"
			aria-label="What you need"
			class="{blank} cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%228%22%3E%3Cpath%20d=%22M1%201l5%205%205-5%22%20fill=%22none%22%20stroke=%22%23ff5640%22%20stroke-width=%222%22/%3E%3C/svg%3E')] bg-[length:0.38em_auto] bg-[right_0.2em_center] bg-no-repeat pr-[1.1em]"
		>
			{#each projectTypes as type (type.value)}
				<option value={type.value} class="bg-[#05030f] text-base text-slate-200"
					>{type.phrase}</option
				>
			{/each}
		</select><span class="{strip} pl-[0.04em]">. Reach me at</span>
		<input
			id="contact-email"
			name="email"
			type="email"
			autocomplete="email"
			placeholder="you@example.com"
			aria-label="Your email"
			required
			class="{blank} w-[10.5em]"
		/><span class="{strip} pl-[0.04em]">. Here's the short version:</span>
	</p>
	<textarea
		id="contact-message"
		name="content"
		aria-label="Your message"
		required
		placeholder="What you're making, when you need it, and anything I should know."
		class="google-sans-400 min-h-[5.2em] w-full max-w-176 resize-y rounded-none border border-slate-400/20 bg-[#05030f] px-[0.9em] py-[0.8em] text-[clamp(17px,1.25vw,21px)] leading-normal text-slate-200 placeholder:text-slate-500 focus:border-[#ff5640] focus:shadow-[0_0_0_1px_#ff5640] focus:outline-none"
	></textarea>
	<SpamCheck bind:reset={resetSpamCheck} />
	<div class="flex flex-wrap items-center gap-3.5">
		<button
			type="submit"
			disabled={status.kind === 'sending'}
			class="google-sans-500 cursor-pointer bg-[#a91a06] px-[1em] py-[0.62em] text-[clamp(15px,1.05vw,18px)] text-white transition-colors hover:bg-[#ff5640] hover:text-[#05030f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5640] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"
		>
			Send it <span aria-hidden="true">→</span>
		</button>
		<p class="google-sans-code-400 text-xs leading-normal" aria-live="polite">
			{#if status.message}
				<span
					class={[
						'bg-[#05030f] box-decoration-clone px-[0.6em] py-[0.5em]',
						status.kind === 'error' ? 'text-[#ff5640]' : 'text-slate-300'
					]}>{status.message}</span
				>
			{/if}
		</p>
	</div>
	<p class="flex flex-wrap gap-1.5">
		{#each contactLinks as link (link.href)}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- contactLinks are all mailto: or https: URLs -->
			<a
				href={link.href}
				class="google-sans-code-400 bg-[#05030f] px-[0.8em] py-[0.7em] text-sm leading-none text-slate-300 transition-colors hover:bg-[#a91a06] hover:text-white motion-reduce:transition-none"
				>{link.short === 'Email' ? link.label : link.short}</a
			>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/each}
	</p>
</form>
