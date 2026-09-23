<script lang="ts">
	import { enhance } from '$app/forms';
	import SpamCheck from '$lib/components/SpamCheck.svelte';
	import { contactLinks, projectTypes, sendMessage, type SendState } from '$lib/contact';

	let status = $state<SendState>({ kind: 'idle', message: '' });
	let resetSpamCheck = $state<() => void>();

	const field =
		'google-sans-400 w-full rounded-none border border-slate-400/20 bg-[#05030f] px-[0.8em] py-[0.72em] text-[17px] leading-[1.4] text-slate-200 placeholder:text-slate-500 focus:border-[#ff5640] focus:shadow-[0_0_0_1px_#ff5640] focus:outline-none';
	const label =
		'google-sans-code-500 justify-self-start bg-[#05030f] px-[0.7em] py-[0.6em] text-[11px] leading-none tracking-[0.08em] text-slate-400 uppercase';
</script>

<div class="grid gap-x-[clamp(24px,4vw,64px)] gap-y-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
	<form
		method="POST"
		action="?/contact"
		class="grid max-w-160 cursor-auto content-center gap-[clamp(8px,1.6vh,14px)]"
		use:enhance={sendMessage(
			(next) => (status = next),
			() => resetSpamCheck?.()
		)}
	>
		<h2 class="google-sans-500 text-[clamp(32px,3.8vw,68px)] leading-[1.15] tracking-[-0.025em]">
			<span class="bg-[#05030f] box-decoration-clone px-[0.14em] pb-[0.04em]"
				>Have a project in mind?</span
			>
			<span class="bg-[#a91a06] box-decoration-clone px-[0.14em] pb-[0.04em] text-white"
				>Let's make it happen.</span
			>
		</h2>
		<fieldset class="flex flex-wrap gap-1.5">
			<legend class="mb-1.5 {label}">What are you looking for?</legend>
			{#each projectTypes as type, i (type.value)}
				<label class="relative">
					<input
						type="radio"
						name="project_type"
						id="project-type-{type.value}"
						value={type.value}
						checked={i === 0}
						class="peer absolute inset-0 m-0 cursor-pointer opacity-0"
					/>
					<span
						class="google-sans-code-500 inline-block border border-slate-400/20 bg-[#05030f] px-[0.9em] py-[0.62em] text-[13px] leading-none text-slate-300 peer-checked:border-[#a91a06] peer-checked:bg-[#a91a06] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#ff5640]"
						>{type.label}</span
					>
				</label>
			{/each}
		</fieldset>
		<div class="grid gap-3.5 sm:grid-cols-2">
			<div class="grid">
				<label for="contact-name" class={label}>Name</label>
				<input id="contact-name" name="name" autocomplete="name" required class={field} />
			</div>
			<div class="grid">
				<label for="contact-email" class={label}>Email</label>
				<input
					id="contact-email"
					name="email"
					type="email"
					autocomplete="email"
					required
					class={field}
				/>
			</div>
		</div>
		<div class="grid">
			<label for="contact-subject" class={label}>Subject (optional)</label>
			<input id="contact-subject" name="subject" class={field} />
		</div>
		<div class="grid">
			<label for="contact-message" class={label}>Message</label>
			<textarea
				id="contact-message"
				name="content"
				required
				placeholder="What you're making, when you need it, and anything I should know."
				class="{field} min-h-[clamp(3.4em,11.5vh,6.2em)] resize-y"></textarea>
		</div>
		<SpamCheck bind:reset={resetSpamCheck} />
		<div class="flex flex-wrap items-center gap-3.5">
			<button
				type="submit"
				disabled={status.kind === 'sending'}
				class="google-sans-500 cursor-pointer bg-[#a91a06] px-[1em] py-[0.62em] text-[clamp(15px,1.05vw,18px)] text-white transition-colors hover:bg-[#ff5640] hover:text-[#05030f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5640] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"
			>
				Send message <span aria-hidden="true">→</span>
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
	</form>
	<div class="grid content-end justify-items-start gap-1.5 lg:justify-items-end">
		<p class="google-sans-code-500 text-[11px] tracking-[0.08em] text-slate-400 uppercase">
			<span class="inline-block bg-[#05030f] px-[0.7em] py-[0.6em]">Or directly</span>
		</p>
		{#each contactLinks as link (link.href)}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- contactLinks are all mailto: or https: URLs -->
			<a
				href={link.href}
				class="google-sans-code-400 bg-[#05030f] px-[0.8em] py-[0.7em] text-sm leading-none text-slate-300 transition-colors hover:bg-[#a91a06] hover:text-white motion-reduce:transition-none"
				>{link.label}</a
			>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/each}
	</div>
</div>
