<!--
	Signing in as the author, for me only: comments then post as Em1t, and any comment can be
	deleted. Signed in, it lists the latest comments on every page.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import SpamCheck from '$lib/components/SpamCheck.svelte';
	import { AUTHOR_NAME, commenterName, formatCommentDate } from '$lib/comments';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let sending = $state(false);
	let resetSpamCheck = $state<() => void>();

	const signIn: SubmitFunction = () => {
		sending = true;
		return async ({ update }) => {
			await update();
			sending = false;
			resetSpamCheck?.();
		};
	};
	const confirmDelete: SubmitFunction = ({ cancel }) => {
		if (!confirm('Delete this comment, and any replies to it?')) cancel();
	};

	const label =
		'google-sans-code-500 justify-self-start py-[0.6em] text-[11px] leading-none tracking-[0.08em] text-slate-400 uppercase';
	const button =
		'google-sans-500 cursor-pointer bg-[#a91a06] px-[1em] py-[0.62em] text-[clamp(15px,1.05vw,18px)] text-white transition-colors hover:bg-[#ff5640] hover:text-[#05030f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5640] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none';
	const action =
		'google-sans-code-500 cursor-pointer text-[11px] tracking-[0.08em] text-slate-400 uppercase hover:text-[#ff5640]';
</script>

<svelte:head>
	<title>{data.author ? 'Comments' : 'Sign in'} · em1t.me</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main
	class="min-h-dvh bg-[#05030f] px-4 py-[clamp(32px,8vh,96px)] text-slate-200 md:px-10 lg:px-20"
>
	<div class="mx-auto grid max-w-3xl gap-10">
		<a
			href={resolve('/blog')}
			class="google-sans-code-500 justify-self-start bg-[#05030f] py-[0.6em] text-xs leading-none tracking-widest text-slate-300 uppercase hover:text-[#ff5640]"
			>← Blog</a
		>

		{#if data.author}
			<header class="grid gap-4">
				<h1 class="google-sans-500 text-[clamp(32px,4vw,56px)] leading-[1.15] tracking-[-0.025em]">
					Signed in as <span class="bg-[#a91a06] box-decoration-clone px-[0.14em] text-white"
						>{AUTHOR_NAME}</span
					>
				</h1>
				<p class="google-sans-400 max-w-[34em] text-[17px] leading-[1.7] text-slate-300">
					Comments you post in this browser show as {AUTHOR_NAME}, marked as the author, and every
					comment has a Delete button. You stay signed in for {data.days} days.
				</p>
				<form method="POST" action="?/signOut" use:enhance>
					<button class={action}>Sign out</button>
				</form>
			</header>

			<section class="grid gap-4" aria-labelledby="latest">
				<h2 id="latest" class={label}>Latest comments</h2>
				{#if data.recent.length}
					<ol class="grid border-b border-slate-400/20">
						{#each data.recent as comment (comment.id)}
							<li class="grid gap-2 border-t border-slate-400/20 py-4">
								<p class="google-sans-code-400 flex flex-wrap gap-x-2 text-xs text-slate-500">
									<span class={comment.author ? 'text-[#ff5640]' : 'text-slate-200'}
										>{commenterName(comment)}</span
									>
									<span>on</span>
									<!-- eslint-disable svelte/no-navigation-without-resolve -- links to stored page paths -->
									<a
										href="{comment.page}#comment-{comment.id}"
										class="text-slate-300 hover:text-[#ff5640]"
										>{data.titles[comment.page] ?? comment.page}</a
									>
									<time datetime={comment.created}>· {formatCommentDate(comment.created)}</time>
								</p>
								<p
									class="google-sans-400 line-clamp-4 text-[16px] leading-[1.65] [overflow-wrap:anywhere] whitespace-pre-wrap text-slate-300"
								>
									{comment.body}
								</p>
								<div class="flex gap-5">
									<a href="{comment.page}?reply={comment.id}#comment-{comment.id}" class={action}
										>Reply</a
									>
									<!-- eslint-enable svelte/no-navigation-without-resolve -->
									<form method="POST" action="?/deleteComment" use:enhance={confirmDelete}>
										<input type="hidden" name="id" value={comment.id} />
										<button class={action}>Delete</button>
									</form>
								</div>
							</li>
						{/each}
					</ol>
				{:else}
					<p class="google-sans-400 text-[17px] text-slate-400">No comments yet.</p>
				{/if}
			</section>
		{:else}
			<form method="POST" action="?/signIn" class="grid max-w-[26em] gap-3" use:enhance={signIn}>
				<h1 class="google-sans-500 text-[clamp(32px,4vw,56px)] leading-[1.15] tracking-[-0.025em]">
					Sign in
				</h1>
				<p class="google-sans-400 mb-2 text-[17px] leading-[1.7] text-slate-300">
					For the author. Signed in, comments post as {AUTHOR_NAME}.
				</p>
				<!-- Lets password managers file the password under a name. -->
				<input type="text" name="username" autocomplete="username" value={AUTHOR_NAME} hidden />
				<label for="password" class={label}>Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					class="google-sans-400 w-full rounded-none border border-slate-400/20 bg-[#05030f] px-[0.8em] py-[0.72em] text-[17px] leading-[1.4] text-slate-200 focus:border-[#ff5640] focus:shadow-[0_0_0_1px_#ff5640] focus:outline-none"
				/>
				<SpamCheck bind:reset={resetSpamCheck} />
				<div class="mt-1 flex flex-wrap items-center gap-3.5">
					<button type="submit" disabled={sending} class={button}>
						Sign in <span aria-hidden="true">→</span>
					</button>
					<p class="google-sans-code-400 text-xs text-[#ff5640]" aria-live="polite">
						{form?.error ?? ''}
					</p>
				</div>
			</form>
		{/if}
	</div>
</main>
