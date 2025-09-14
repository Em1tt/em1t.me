<script lang="ts">
	import { Stage, Layer, Rect, Line, Circle, Text, type KonvaMouseEvent } from 'svelte-konva';
	import { onMount, onDestroy } from 'svelte';

    let {
        oneAxis = false,
		x = $bindable(0),
		y = $bindable(120),
		distance = $bindable(0)
    }: {
        oneAxis?: boolean;
		x?: number;
		y?: number;
		distance?: number;
    } = $props();

    let isHovering = false;
    let animationId: number;
    let mouseLeaveTimeout: number;
    let isPaused = $state(false);

    function calculateDistance() {
		if(oneAxis){
			distance = Math.round(Math.abs(x - 390));
		}else{
			const dx = x - 390;
			const dy = y - 120;
			distance = Math.round(Math.sqrt(dx * dx + dy * dy));
		}
    }

    function animate() {
        if (!isHovering && !isPaused) {
            // Animate X between 300 and 480 using sine wave
			if(!oneAxis){
				y = 30 + (Math.cos(Date.now() * 0.001) + 1) * 90;
			}
            x = 300 + (Math.sin(Date.now() * 0.001) + 1) * 120;
            calculateDistance();
        }
        animationId = requestAnimationFrame(animate);
    }

    function togglePause() {
        isPaused = !isPaused;
    }

    function handleMouseEnter() {
		if(isPaused) return;
        // Clear any pending mouse leave timeout
        if (mouseLeaveTimeout) {
            clearTimeout(mouseLeaveTimeout);
            mouseLeaveTimeout = 0;
        }
        if (!isHovering) {
            isHovering = true;
            console.log('enter');
        }
    }

    function handleMouseOut() {
        // Debounce mouse leave to prevent flickering
        if (mouseLeaveTimeout) {
            clearTimeout(mouseLeaveTimeout);
        }
        mouseLeaveTimeout = setTimeout(() => {
            isHovering = false;
            console.log('out');
        }, 50);
    }

    function handleMouseMove(event: KonvaMouseEvent) {
		if(isPaused) return;
        // Ensure we're hovering when moving
        handleMouseEnter();
        
        const stage = event.detail.target.getStage();
        const pointerPosition = stage?.getPointerPosition();
        if (pointerPosition) {
            x = pointerPosition.x;
            if (!oneAxis) {
                y = pointerPosition.y;
            }
            calculateDistance();
        }
    }

    onMount(() => {
        animate();
    });

    onDestroy(() => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        if (mouseLeaveTimeout) {
            clearTimeout(mouseLeaveTimeout);
        }
    });
</script>

<div class="flex w-full items-center flex-col">
<div class="relative">
    <Stage on:mousemove={handleMouseMove} on:mouseenter={handleMouseEnter} on:mouseout={handleMouseOut} config={{ width: 768, height: 240 }}>
        <Layer>
            {#each Array(27), index}
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
                    points: [0, index * 30, 768, index * 30],
                    stroke: "#10182b",
                    strokeWidth: 2,
                    listening: false,
                    perfectDrawEnabled: false
                }} />
            {/each}
        </Layer>
        <Layer>
            {#if !oneAxis}
                <Circle config={{ x, y: 120, radius: 6, fill: '#2713b7', strokeWidth: 2, draggable: false }} />
                <Text config={{ x: x - 10, y: 135, text: 'C', fontSize: 20, fill: '#2713b7', fontFamily: 'KaTeX_Math', fontStyle: 'bold' }} />
                <Line config={{
                    points: [390, 120, x, 120, x, y],
                    stroke: '#2713b7',
                    strokeWidth: 2,
                    lineCap: 'round',
                    lineJoin: 'round',
                    dash: [10, 5],
                    opacity: 0.5,
                    listening: false,
                    perfectDrawEnabled: false
                }} />
                <Line config={{
                    points: [390, 120, x, y],
                    stroke: '#fff',
                    strokeWidth: 2,
                    lineCap: 'round',
                    lineJoin: 'round',
                    listening: false,
                    perfectDrawEnabled: false
                }} />
            {/if}
            <Circle config={{ x: 390, y: 120, radius: 6, fill: '#f63b3b', strokeWidth: 2, draggable: false }} />
            <Circle config={{ x, y, radius: 6, fill: '#10b951', strokeWidth: 2, draggable: false }} />
            <Text config={{ x: 380, y: 135, text: 'A', fontSize: 20, fill: '#f63b3b', fontFamily: 'KaTeX_Math', fontStyle: 'bold' }} />
            <Text config={{ x: x - 10, y: y + 15, text: 'B', fontSize: 20, fill: '#10b951', fontFamily: 'KaTeX_Math', fontStyle: 'bold' }} />
        </Layer>
    </Stage>
    
    <!-- Pause button positioned at top right of stage -->
    <button 
        class="absolute top-2 right-2 px-3 py-1 text-xs font-bold text-white rounded-md transition-colors duration-200 {isPaused ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}"
        onclick={togglePause}
    >
        {isPaused ? 'Play' : 'Pause'}
    </button>
</div>

<p class="!my-0">Distance: {distance}</p>
</div>