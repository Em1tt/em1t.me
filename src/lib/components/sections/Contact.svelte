<script lang="ts">
	import { CONTACT_VARIANT } from '$lib/config';
	import SectionLabel from '$lib/components/SectionLabel.svelte';
	import Torch from '$lib/components/Torch.svelte';
	import ContactForm from './ContactForm.svelte';
	import ContactSentence from './ContactSentence.svelte';
</script>

<section
	id="contact"
	class="relative isolate min-h-dvh w-full cursor-crosshair touch-pan-y snap-start overflow-hidden bg-[#05030f] px-4 text-slate-200 md:px-10 lg:px-20"
>
	<Torch art={CONTACT_VARIANT === 'sentence' ? '/bg4.png' : '/blackhole.png'} />
	<div
		class="relative z-1 mx-auto grid min-h-dvh w-full max-w-7xl grid-rows-[auto_minmax(0,1fr)] gap-[clamp(12px,2.2vh,20px)] py-[clamp(24px,6vh,72px)]"
	>
		<div>
			<SectionLabel>Contact</SectionLabel>
		</div>
		{#if CONTACT_VARIANT === 'sentence'}
			<ContactSentence />
		{:else}
			<ContactForm />
		{/if}
	</div>
</section>
