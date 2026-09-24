<!--
	A new comment, or a reply when `parent` is set. Posts to the page's ?/comment action, which sends
	the page back scrolled to the new comment. Signed in at /admin, it posts as Em1t with no name
	field and no spam check.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { SubmitFunction } from '@sveltejs/kit';
	import SpamCheck from '$lib/components/SpamCheck.svelte';
	import { AUTHOR_NAME, BODY_MAX, NAME_MAX } from '$lib/comments';
	import { commenter } from '$lib/commenter.svelte';

	type Props = {
		author: boolean;
		/** The comment this replies to. */
		parent?: number;
		/** Their name, for the heading. */
		replyTo?: string;
		/** After the reply posts, or on Cancel. */
		ondone?: () => void;
	};
	let { author, parent, replyTo, ondone }: Props = $props();

	const id = $props.id();
	let body = $state('');
	let sending = $state(false);
	let error = $state('');
	let resetSpamCheck = $state<() => void>();

	// Without JavaScript, a comment that didn't post comes back with its error in `page.form`.
	const message = $derived(
		error || (!parent && typeof page.form?.error === 'string' ? page.form.error : '')
	);

	$effect(() => commenter.restore());

	const submit: SubmitFunction = () => {
		sending = true;
		error = '';
		commenter.save();
		return async ({ result, update }) => {
			sending = false;
			// A Turnstile token works once, so the check starts over whatever happened.
			resetSpamCheck?.();
			if (result.type === 'redirect') {
				body = '';
				await update({ reset: false });
				ondone?.();
			} else {
				error =
					result.type === 'failure' && typeof result.data?.error === 'string'
						? result.data.error
						: "That didn't post. Try again.";
			}
		};
	};

	// A reply form opens where the reader clicked Reply, ready to type in.
	const focusReply = (textarea: HTMLTextAreaElement) => {
		if (parent) textarea.focus();
	};

	const label =
		'google-sans-code-500 justify-self-start py-[0.6em] text-[11px] leading-none tracking-[0.08em] text-slate-400 uppercase';
	const field =
		'google-sans-400 w-full rounded-none border border-slate-400/20 bg-[#05030f] px-[0.8em] py-[0.72em] text-[17px] leading-[1.5] text-slate-200 placeholder:text-slate-500 focus:border-[#ff5640] focus:shadow-[0_0_0_1px_#ff5640] focus:outline-none';
</script>

<form
	method="POST"
	action="?/comment"
	class="grid max-w-[40em] gap-3"
	aria-label={parent ? `Reply to ${replyTo}` : 'Leave a comment'}
	use:enhance={submit}
>
	{#if parent}
		<input type="hidden" name="parent" value={parent} />
	{/if}
	{#if author}
		<p
			class="google-sans-code-400 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400"
		>
			Posting as
			<span class="google-sans-500 bg-[#a91a06] px-[0.4em] py-[0.1em] text-sm text-white"
				>{AUTHOR_NAME}</span
			>
			<a
				href={resolve('/admin')}
				class="underline decoration-[#ff5640] underline-offset-4 hover:text-white">signed in</a
			>
		</p>
	{:else}
		<div class="grid sm:max-w-[20em]">
			<label for="{id}-name" class={label}>Name (optional)</label>
			<input
				id="{id}-name"
				name="name"
				maxlength={NAME_MAX}
				autocomplete="nickname"
				placeholder="Anonymous"
				bind:value={commenter.name}
				class={field}
			/>
		</div>
	{/if}
	<div class="grid">
		<label for="{id}-body" class={label}>{parent ? `Reply to ${replyTo}` : 'Comment'}</label>
		<textarea
			id="{id}-body"
			name="body"
			required
			maxlength={BODY_MAX}
			rows={parent ? 3 : 5}
			placeholder={parent ? '' : 'A question, a correction, or what helped.'}
			bind:value={body}
			class="{field} min-h-[5.5em] resize-y"
			{@attach focusReply}></textarea>
	</div>
	{#if !author}
		<SpamCheck bind:reset={resetSpamCheck} />
	{/if}
	<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
		<button
			type="submit"
			disabled={sending}
			class="google-sans-500 cursor-pointer bg-[#a91a06] px-[1em] py-[0.62em] text-[clamp(15px,1.05vw,18px)] text-white transition-colors hover:bg-[#ff5640] hover:text-[#05030f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5640] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"
		>
			{parent ? 'Post reply' : 'Post comment'} <span aria-hidden="true">→</span>
		</button>
		{#if parent}
			<button
				type="button"
				class="google-sans-code-500 cursor-pointer text-[11px] tracking-[0.08em] text-slate-400 uppercase hover:text-[#ff5640]"
				onclick={ondone}>Cancel</button
			>
		{/if}
		<p class="google-sans-code-400 text-xs leading-normal" aria-live="polite">
			{#if message}
				<span class="text-[#ff5640]">{message}</span>
			{:else if sending}
				<span class="text-slate-400">Posting…</span>
			{/if}
		</p>
	</div>
	{#if !author && !parent}
		<p class="google-sans-code-400 text-xs leading-relaxed text-slate-500">
			Plain text, line breaks kept. Your IP address is stored only as a one-way hash, to limit spam.
		</p>
	{/if}
</form>
