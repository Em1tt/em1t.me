/**
 * On the home page, one wheel gesture moves exactly one section, in every browser.
 *
 * Mandatory CSS snapping alone behaves differently per browser: Firefox moves a section for every
 * wheel event, so one touchpad swipe can fly past several, while Chrome snaps to the nearest
 * section when a smooth-scrolling mouse or touchpad stops, so a short swipe springs back.
 * This only takes over on desktops, where layout.css snaps mandatorily; keys, the scrollbar
 * and touch are left to the browser.
 */

const DESKTOP = '(min-width: 1024px) and (min-height: 641px) and (pointer: fine)';
/** A gesture ends after this long without wheel events. Touchpad momentum keeps them coming. */
const QUIET_MS = 200;
/** How far a gesture has to scroll before it turns the page, in pixels. */
const THRESHOLD = 24;

export function pageByWheel(selector = '.snap-start') {
	const desktop = matchMedia(DESKTOP);
	const reduce = matchMedia('(prefers-reduced-motion: reduce)');
	let travel = 0;
	let spent = false;
	let target = -1;
	let quiet = 0;
	let settle = 0;

	const sections = () => [...document.querySelectorAll<HTMLElement>(selector)];

	function nearest(list: HTMLElement[]) {
		let best = 0;
		for (let i = 1; i < list.length; i++) {
			const top = Math.abs(list[i].getBoundingClientRect().top);
			if (top < Math.abs(list[best].getBoundingClientRect().top)) best = i;
		}
		return best;
	}

	// A scrollable box under the pointer, like a long contact message, scrolls first.
	function innerScroll(element: Element | null, down: boolean) {
		for (let el = element; el && el !== document.documentElement; el = el.parentElement) {
			const { overflowY } = getComputedStyle(el);
			if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
				if (down ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) {
					return true;
				}
			}
		}
		return false;
	}

	function onWheel(event: WheelEvent) {
		if (!desktop.matches || event.ctrlKey) return;
		if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
		const down = event.deltaY > 0;
		if (innerScroll(event.target as Element, down)) return;

		const list = sections();
		if (!list.length) return;
		const from = target >= 0 ? target : nearest(list);
		// A section taller than the window scrolls normally until its edge.
		if (target < 0) {
			const box = list[from].getBoundingClientRect();
			if (down ? box.bottom > innerHeight + 2 : box.top < -2) return;
		}

		event.preventDefault();
		clearTimeout(quiet);
		quiet = window.setTimeout(() => {
			travel = 0;
			spent = false;
		}, QUIET_MS);
		if (spent) return;

		const scale =
			event.deltaMode === WheelEvent.DOM_DELTA_LINE
				? 40
				: event.deltaMode === WheelEvent.DOM_DELTA_PAGE
					? innerHeight
					: 1;
		travel += event.deltaY * scale;
		if (Math.abs(travel) < THRESHOLD) return;
		spent = true;

		const next = Math.min(list.length - 1, Math.max(0, from + (down ? 1 : -1)));
		if (next === from) return;
		target = next;
		window.scrollTo({
			top: list[next].getBoundingClientRect().top + scrollY,
			behavior: reduce.matches ? 'instant' : 'smooth'
		});
		clearTimeout(settle);
		settle = window.setTimeout(() => (target = -1), 1500);
	}

	function onScrollEnd() {
		target = -1;
	}

	window.addEventListener('wheel', onWheel, { passive: false });
	window.addEventListener('scrollend', onScrollEnd);
	return () => {
		clearTimeout(quiet);
		clearTimeout(settle);
		window.removeEventListener('wheel', onWheel);
		window.removeEventListener('scrollend', onScrollEnd);
	};
}
