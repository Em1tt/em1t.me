// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		interface Locals {
			/** Signed in at /admin: comments post as Em1t, and can be deleted. */
			author: boolean;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
