// Blog comments as pages show them; src/lib/server/comments.ts keeps them in D1.
import { formatDate } from '$lib/posts';

export type Comment = {
	id: number;
	/** null for Anonymous. */
	name: string | null;
	body: string;
	/** Posted by me, signed in at /admin. */
	author: boolean;
	/** ISO date and time, UTC. */
	created: string;
};

/** A comment and the replies to it: threads are one level deep. */
export type CommentThread = Comment & { replies: Comment[] };

export const NAME_MAX = 32;
export const BODY_MAX = 2000;
/** Only I can post under this name (see /admin). */
export const AUTHOR_NAME = 'Em1t';

export const commenterName = (comment: Comment) =>
	comment.author ? AUTHOR_NAME : (comment.name ?? 'Anonymous');

/** '2026-09-24T01:23:45Z' → '24 Sep 2026' */
export const formatCommentDate = (iso: string) => formatDate(iso.slice(0, 10));
