<!-- How tatrapak-portal moves an order through its three statuses, and who moves it. -->
<script lang="ts">
	const steps = [
		{
			status: 'Prijatá',
			tone: 'border-sky-400/60 text-sky-300',
			who: 'Obchodník',
			what: 'Creates the order: customer, product lines, dispatch date. Can keep editing it while it is still Prijatá.'
		},
		{
			status: 'Vo výrobe',
			tone: 'border-amber-400/60 text-amber-300',
			who: 'Administratívny pracovník / Správca',
			what: 'Assigns every product line to a production department and presses "Poslať do výroby".'
		},
		{
			status: 'Expedovaná',
			tone: 'border-emerald-400/60 text-emerald-300',
			who: 'Výroba',
			what: 'Each department sees only its own lines and ticks them "Hotové". The last tick dispatches the order.'
		}
	];

	const lines = [
		{ product: 'Produkt A', department: 'Sypké', done: true },
		{ product: 'Produkt B', department: 'Sklad', done: true },
		{ product: 'Produkt C', department: 'Sklad', done: false }
	];
</script>

<figure class="my-9 grid gap-5">
	<ol class="grid gap-3 md:grid-cols-3">
		{#each steps as step, i (step.status)}
			<li class="grid content-start gap-2 border-t border-slate-400/20 pt-3">
				<span class="google-sans-code-500 text-[11px] tracking-[0.08em] text-slate-500 uppercase"
					>Step {i + 1}</span
				>
				<span
					class="google-sans-code-500 justify-self-start border px-[0.6em] py-[0.35em] text-xs {step.tone}"
					>{step.status}</span
				>
				<span class="google-sans-500 text-[17px] text-slate-200">{step.who}</span>
				<span class="google-sans-400 text-[15px] leading-relaxed text-slate-400">{step.what}</span>
			</li>
		{/each}
	</ol>
	<div class="border border-slate-400/20 bg-[#0c0a1a] p-4">
		<p class="google-sans-code-500 mb-3 text-[11px] tracking-[0.08em] text-slate-400 uppercase">
			One order, three lines, two departments
		</p>
		<ul class="grid gap-2">
			{#each lines as line (line.product)}
				<li class="google-sans-code-400 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
					<span
						class="grid size-4 place-items-center border {line.done
							? 'border-emerald-400 bg-emerald-400/20 text-emerald-300'
							: 'border-slate-500 text-transparent'}"
						aria-hidden="true">✓</span
					>
					<span class="min-w-[9ch] text-slate-200">{line.product}</span>
					<span class="text-slate-500">oddelenie: {line.department}</span>
					<span class={line.done ? 'text-emerald-300' : 'text-amber-300'}
						>{line.done ? 'Hotové' : 'čaká'}</span
					>
				</li>
			{/each}
		</ul>
		<p class="google-sans-code-400 mt-3 text-xs text-slate-400">
			Status stays <span class="text-amber-300">Vo výrobe</span> until the last line is ticked.
		</p>
	</div>
	<figcaption class="google-sans-code-400 max-w-[60ch] text-xs leading-relaxed text-slate-400">
		The statuses, roles, button labels and department names are the portal's own. The example order
		is made up.
	</figcaption>
</figure>
