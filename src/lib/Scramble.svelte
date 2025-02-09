<script lang="ts">
	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#$!|\\€đĐ[]łŁ$ß¤>#&@{}<>*';

	let { children } = $props();

	function scramble(event: MouseEvent | FocusEvent) {
		const element = event.target as HTMLElement;
		let iterations = 0;
		const interval = setInterval(() => {
			element.innerText = element.innerText
				.split('')
				.map((l, index) => {
					if (index < iterations) {
						if (!element.dataset.value) return;
						return element.dataset.value[index];
					}
					return letters[Math.floor(Math.random() * letters.length)];
				})
				.join('');

			if (iterations >= element.innerText.length) clearInterval(interval);

			iterations += 1 / 3;
		}, 30);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onmouseover={scramble} onfocus={scramble}>
    {@render children()}
</div>