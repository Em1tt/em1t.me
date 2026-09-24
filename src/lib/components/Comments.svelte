<!--
	Comments under a post or chapter: threads one reply deep, then the form for a new comment.
	Signed in at /admin, comments post as Em1t, and each one gets a Delete button.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { untrack } from 'svelte';
	import {
		AUTHOR_NAME,
		commenterName,
		formatCommentDate,
		type Comment,
		type CommentThread
	} from '$lib/comments';
	import CommentForm from './CommentForm.svelte';

	let { comments, author }: { comments: CommentThread[] | null; author: boolean } = $props();

	// The comment being replied to. Links in the Discord pings open with one: ?reply=<id>.
	let replyingTo = $state(untrack(() => Number(page.url.searchParams.get('reply')) || null));
	const target = $derived.by(() => {
		for (const thread of comments ?? []) {
			const comment = [thread, ...thread.replies].find((comment) => comment.id === replyingTo);
			if (comment) return { thread: thread.id, comment };
		}
	});
	const count = $derived(
		comments?.reduce((total, thread) => total + 1 + thread.replies.length, 0) ?? 0
	);

	const confirmDelete: SubmitFunction = ({ cancel }) => {
		if (!confirm('Delete this comment, and any replies to it?')) cancel();
	};

	const action =
		'google-sans-code-500 cursor-pointer text-[11px] tracking-[0.08em] text-slate-400 uppercase hover:text-[#ff5640]';
	const text =
		'google-sans-400 max-w-[40em] text-[17px] leading-[1.7] whitespace-pre-wrap text-slate-300 [overflow-wrap:anywhere]';
</script>

{#snippet entry(comment: Comment)}
	<article
		id="comment-{comment.id}"
		class={[
			'-mx-3 grid scroll-mt-8 gap-2 px-3 py-3.5',
			page.url.hash === `#comment-${comment.id}` && 'bg-[#a91a06]/15'
		]}
	>
		<header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
			{#if comment.author}
				<span class="google-sans-500 bg-[#a91a06] px-[0.4em] py-[0.05em] text-white"
					>{AUTHOR_NAME}</span
				>
				<span class="google-sans-code-500 text-[11px] tracking-[0.08em] text-[#ff5640] uppercase"
					>Author</span
				>
			{:else}
				<span class="google-sans-500 text-slate-100">{commenterName(comment)}</span>
			{/if}
			<time
				datetime={comment.created}
				title={comment.created.replace('T', ' ').replace('Z', ' UTC')}
				class="google-sans-code-400 text-xs text-slate-500"
				>{formatCommentDate(comment.created)}</time
			>
		</header>
		<p class={text}>{comment.body}</p>
		<div class="flex gap-5">
			<button type="button" class={action} onclick={() => (replyingTo = comment.id)}>Reply</button>
			{#if author}
				<form method="POST" action="?/deleteComment" use:enhance={confirmDelete}>
					<input type="hidden" name="id" value={comment.id} />
					<button class={action}>Delete</button>
				</form>
			{/if}
		</div>
	</article>
{/snippet}

<section
	id="comments"
	class="mt-[clamp(64px,10vh,120px)] grid scroll-mt-8 gap-8 border-t border-slate-400/20 pt-8"
	aria-labelledby="comments-title"
>
	<h2
		id="comments-title"
		class="google-sans-500 flex items-baseline gap-3 text-[clamp(26px,2.2vw,38px)] leading-[1.15] tracking-[-0.02em] text-slate-200"
	>
		Comments
		{#if count}
			<span class="google-sans-code-500 text-[13px] tracking-[0.08em] text-[#ff5640]">{count}</span>
		{/if}
	</h2>

	{#if comments === null}
		<p class="google-sans-400 text-[17px] text-slate-400">
			Comments are offline right now. Try again later.
		</p>
	{:else}
		{#if comments.length}
			<ol class="grid border-b border-slate-400/20">
				{#each comments as thread (thread.id)}
					<li class="border-t border-slate-400/20 py-2 first:border-t-0">
						{@render entry(thread)}
						{#if thread.replies.length}
							<ol class="ml-3 grid border-l border-slate-400/25 pl-4 sm:ml-5 sm:pl-6">
								{#each thread.replies as reply (reply.id)}
									<li>{@render entry(reply)}</li>
								{/each}
							</ol>
						{/if}
						{#if target?.thread === thread.id}
							<div class="ml-3 border-l border-[#ff5640] pt-2 pb-5 pl-4 sm:ml-5 sm:pl-6">
								<CommentForm
									{author}
									parent={target.comment.id}
									replyTo={commenterName(target.comment)}
									ondone={() => (replyingTo = null)}
								/>
							</div>
						{/if}
					</li>
				{/each}
			</ol>
		{:else}
			<p class="google-sans-400 text-[17px] text-slate-400">
				No comments yet. Questions and corrections are welcome.
			</p>
		{/if}
		<CommentForm {author} />
	{/if}
</section>
