// The language a reader picked for code examples. Every CodeGroup on the page follows it, and
// it's remembered in this browser for the next post.

export const LANGUAGES = [
	{ id: 'javascript', label: 'JS', name: 'JavaScript' },
	{ id: 'typescript', label: 'TS', name: 'TypeScript' },
	{ id: 'python', label: 'Py', name: 'Python' }
] as const;

export type CodeLanguage = (typeof LANGUAGES)[number]['id'];

const KEY = 'code-language';
// The server always renders TypeScript; a stored choice is applied once the page runs.
let current = $state<CodeLanguage>('typescript');

export const codeLanguage = {
	get current() {
		return current;
	},
	set(language: CodeLanguage) {
		current = language;
		try {
			localStorage.setItem(KEY, language);
		} catch {
			// Storage can be blocked; the choice still holds for this page.
		}
	},
	restore() {
		try {
			const saved = localStorage.getItem(KEY);
			if (LANGUAGES.some((language) => language.id === saved)) current = saved as CodeLanguage;
		} catch {
			// Nothing saved, or storage is blocked.
		}
	}
};
