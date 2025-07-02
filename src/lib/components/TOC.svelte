<script lang="ts">
    import { onMount } from 'svelte';
    
    let tocContent = $state('');
    let showToc = $state(false);

    onMount(() => {
        // Wait for the content to be rendered
        setTimeout(() => {
            const tocElement = document.querySelector('#sections + ul');
            if (tocElement) {
                tocContent = tocElement.outerHTML;
                showToc = true;
            }
        }, 100);
    });
</script>

{#if showToc}
    <div class="toc text-slate-300 text-sm">
        {@html tocContent}
    </div>
{/if}

<style lang="postcss">
    @reference "../../app.css";

    .toc {
        position: relative;
        padding-left: 1rem;
    }

    .toc::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 1px;
        background-color: #374151; /* Gray border color */
    }

    .toc :global(ul) {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .toc :global(li) {
        position: relative;
        margin: 0.25rem 0;
    }

    .toc :global(a) {
        display: block;
        padding: 0.25rem 0;
        text-decoration: none;
        color: inherit;
        position: relative;
        transition: color 0.2s ease;
    }

    .toc :global(a::before) {
        content: '';
        position: absolute;
        left: -1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 2px;
        height: 100%;
        background-color: white;
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    /* Fix positioning for nested lists */
    .toc :global(ul ul a::before) {
        left: -2rem;
    }

    .toc :global(ul ul ul a::before) {
        left: -3rem;
    }

    .toc :global(ul ul ul ul a::before) {
        left: -4rem;
    }

    .toc :global(a:hover::before) {
        opacity: 1;
    }

    .toc :global(a:hover) {
        color: white;
    }

    /* Handle nested lists */
    .toc :global(ul ul) {
        padding-left: 1rem;
        margin-top: 0.25rem;
    }
</style>