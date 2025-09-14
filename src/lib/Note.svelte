<script lang="ts">
    const {
        children,
        color = 'yellow'
    }: {
        children: any;
        color?: 'yellow' | 'blue' | 'green' | 'red';
    } = $props();

    ['bg-yellow-200/20', 'border-yellow-400', 'bg-blue-200/20', 'border-blue-400', 'bg-green-200/20', 'border-green-400', 'bg-red-200/20', 'border-red-400'];
</script>

<div class={`bg-${color}-200/20 border-l-4 border-${color}-400 p-4 my-8 rounded-r-md`}>
    {@render children?.()}

</div>