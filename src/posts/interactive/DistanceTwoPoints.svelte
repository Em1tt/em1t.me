<script>
	import { Stage, Layer, Rect, Line, Circle } from 'svelte-konva';

    let x = $state(0);
    let y = $state(0);

    function handleMouseMove(event) {
        const stage = event.detail.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        x = pointerPosition.x;
        y = pointerPosition.y;
    }
</script>

<div class="flex w-full items-center flex-col">
<Stage on:mousemove={handleMouseMove} config={{ width: 600, height: 240 }}>
	<Layer>
		{#each Array(21), index}
			<Line config={{
				points: [index * 30, 0, index * 30, 240],
				stroke: "#10182b",
				strokeWidth: 2,
				listening: false,
				perfectDrawEnabled: false
			}} />
		{/each}
		{#each Array(9), index}
			<Line config={{
				points: [0, index * 30, 600, index * 30],
				stroke: "#10182b",
				strokeWidth: 2,
				listening: false,
				perfectDrawEnabled: false
			}} />
		{/each}
	</Layer>
    <Layer>
        <Circle config={{ x: 300, y: 120, radius: 6, fill: '#f63b3b', strokeWidth: 2, draggable: false }} />
        <Circle config={{ x, y, radius: 6, fill: '#10b951', strokeWidth: 2, draggable: false }} />
    </Layer>
</Stage>
<p>Distance: {Math.round(Math.sqrt((x - 300) ** 2 + (y - 120) ** 2))}</p>
</div>