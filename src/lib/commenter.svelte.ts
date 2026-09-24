// The name a reader comments under. Every comment form on the page shares it, and it's remembered
// in this browser for the next visit.

const KEY = 'comment-name';
let name = $state('');
let restored = false;

export const commenter = {
	get name() {
		return name;
	},
	set name(value: string) {
		name = value;
	},
	/** Once per visit, so a form that opens later doesn't undo what was typed in another. */
	restore() {
		if (restored) return;
		restored = true;
		try {
			name = localStorage.getItem(KEY) ?? '';
		} catch {
			// Nothing saved, or storage is blocked.
		}
	},
	save() {
		try {
			if (name.trim()) localStorage.setItem(KEY, name.trim());
			else localStorage.removeItem(KEY);
		} catch {
			// Storage can be blocked; the name still holds for this page.
		}
	}
};
