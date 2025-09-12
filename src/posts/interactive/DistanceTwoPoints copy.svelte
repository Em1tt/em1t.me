<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';

    let {
        oneAxis = false,
		x = $bindable(0),
		y = $bindable(120),
		z = $bindable(60),
		distance = $bindable(0)
    }: {
        oneAxis?: boolean;
		x?: number;
		y?: number;
		z?: number;
		distance?: number;
    } = $props();

    let canvas: HTMLCanvasElement;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let animationId: number;
    let isPaused = false;
    let isHovering = false;
    
    // 3D Points
    const pointA = { x: 0, y: 0, z: 0 }; // Origin point
    let pointB = { x: 2, y: 1, z: 1 }; // Moving point
    
    // Three.js objects
    let sphereA: THREE.Mesh;
    let sphereB: THREE.Mesh;
    let distanceLine: THREE.Line;
    let projectionLines: THREE.Group;
    let gridHelper: THREE.GridHelper;
    let axesHelper: THREE.AxesHelper;
    let labelA: THREE.Sprite;
    let labelB: THREE.Sprite;

    function calculateDistance() {
        const dx = pointB.x - pointA.x;
        const dy = pointB.y - pointA.y;
        const dz = pointB.z - pointA.z;
        distance = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 100) / 100;
        
        // Update bindable values
        x = Math.round(pointB.x * 100);
        y = Math.round(pointB.y * 100);
        z = Math.round(pointB.z * 100);
    }

    function createTextSprite(text: string, color: string = '#ffffff'): THREE.Sprite {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = 128;
        canvas.height = 64;
        
        context.fillStyle = color;
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 64, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        return new THREE.Sprite(material);
    }

    function updateScene() {
        if (!scene) return;
        
        // Update sphere B position
        sphereB.position.set(pointB.x, pointB.y, pointB.z);
        
        // Update distance line
        const points = [
            new THREE.Vector3(pointA.x, pointA.y, pointA.z),
            new THREE.Vector3(pointB.x, pointB.y, pointB.z)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        distanceLine.geometry.dispose();
        distanceLine.geometry = geometry;
        
        // Update projection lines (showing 3D components)
        projectionLines.clear();
        
        // X component (red)
        const xLine = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pointA.x, pointA.y, pointA.z),
            new THREE.Vector3(pointB.x, pointA.y, pointA.z)
        ]);
        const xLineMesh = new THREE.Line(xLine, new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.7, transparent: true }));
        projectionLines.add(xLineMesh);
        
        // Y component (green)  
        const yLine = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pointB.x, pointA.y, pointA.z),
            new THREE.Vector3(pointB.x, pointB.y, pointA.z)
        ]);
        const yLineMesh = new THREE.Line(yLine, new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.7, transparent: true }));
        projectionLines.add(yLineMesh);
        
        // Z component (blue)
        const zLine = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pointB.x, pointB.y, pointA.z),
            new THREE.Vector3(pointB.x, pointB.y, pointB.z)
        ]);
        const zLineMesh = new THREE.Line(zLine, new THREE.LineBasicMaterial({ color: 0x0000ff, opacity: 0.7, transparent: true }));
        projectionLines.add(zLineMesh);
        
        // Update labels
        labelB.position.set(pointB.x + 0.2, pointB.y + 0.2, pointB.z + 0.2);
        
        calculateDistance();
    }

    function animate() {
        if (!isPaused && !isHovering) {
            const time = Date.now() * 0.001;
            pointB.x = 1 + Math.sin(time) * 1.5;
            pointB.y = 0.5 + Math.cos(time * 0.8) * 1;
            pointB.z = 0.5 + Math.sin(time * 1.2) * 1;
            updateScene();
        }
        
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
        animationId = requestAnimationFrame(animate);
    }

    function togglePause() {
        isPaused = !isPaused;
    }

    function onMouseMove(event: MouseEvent) {
        if (isPaused) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouse = {
            x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((event.clientY - rect.top) / rect.height) * 2 + 1
        };
        
        // Convert mouse position to 3D coordinates
        pointB.x = mouse.x * 3;
        pointB.y = mouse.y * 2 + 1;
        pointB.z = Math.sin(mouse.x * 2) * 1.5;
        
        updateScene();
    }

    function onMouseEnter() {
        if (!isPaused) isHovering = true;
    }

    function onMouseLeave() {
        isHovering = false;
    }

    onMount(() => {
        // Initialize Three.js scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8f9fa);
        
        // Camera
        camera = new THREE.PerspectiveCamera(75, 768 / 480, 0.1, 1000);
        camera.position.set(4, 3, 4);
        camera.lookAt(0, 0, 0);
        
        // Renderer
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(768, 480);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        // Grid and axes
        gridHelper = new THREE.GridHelper(6, 12, 0x444444, 0x888888);
        gridHelper.position.y = -0.1;
        scene.add(gridHelper);
        
        axesHelper = new THREE.AxesHelper(2);
        scene.add(axesHelper);
        
        // Create spheres for points
        const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        
        sphereA = new THREE.Mesh(
            sphereGeometry,
            new THREE.MeshLambertMaterial({ color: 0xff3b3b })
        );
        sphereA.position.set(pointA.x, pointA.y, pointA.z);
        sphereA.castShadow = true;
        scene.add(sphereA);
        
        sphereB = new THREE.Mesh(
            sphereGeometry,
            new THREE.MeshLambertMaterial({ color: 0x10b951 })
        );
        sphereB.position.set(pointB.x, pointB.y, pointB.z);
        sphereB.castShadow = true;
        scene.add(sphereB);
        
        // Distance line
        const lineGeometry = new THREE.BufferGeometry();
        distanceLine = new THREE.Line(
            lineGeometry,
            new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 })
        );
        scene.add(distanceLine);
        
        // Projection lines group
        projectionLines = new THREE.Group();
        scene.add(projectionLines);
        
        // Labels
        labelA = createTextSprite('A', '#ff3b3b');
        labelA.position.set(pointA.x + 0.2, pointA.y + 0.2, pointA.z + 0.2);
        labelA.scale.set(0.5, 0.25, 1);
        scene.add(labelA);
        
        labelB = createTextSprite('B', '#10b951');
        labelB.scale.set(0.5, 0.25, 1);
        scene.add(labelB);
        
        // Add mouse controls
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseenter', onMouseEnter);
        canvas.addEventListener('mouseleave', onMouseLeave);
        
        // Initial update and start animation
        updateScene();
        animate();
    });

    onDestroy(() => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        if (canvas) {
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('mouseenter', onMouseEnter);
            canvas.removeEventListener('mouseleave', onMouseLeave);
        }
        if (renderer) {
            renderer.dispose();
        }
    });
</script>

<div class="flex w-full items-center flex-col">
    <div class="relative">
        <canvas bind:this={canvas} class="border border-gray-300 rounded-lg"></canvas>
        
        <!-- Pause button positioned at top right -->
        <button 
            class="absolute top-2 right-2 px-3 py-1 text-xs font-bold text-white rounded-md transition-colors duration-200 {isPaused ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}"
            on:click={togglePause}
        >
            {isPaused ? 'Play' : 'Pause'}
        </button>
    </div>

    <div class="mt-4 space-y-2 text-sm">
        <p class="!my-0">3D Distance: <span class="font-bold">{distance}</span></p>
        <div class="flex gap-4 text-xs">
            <p class="!my-0">Point A: <span class="text-red-500 font-mono">(0, 0, 0)</span></p>
            <p class="!my-0">Point B: <span class="text-green-500 font-mono">({x/100}, {y/100}, {z/100})</span></p>
        </div>
        <div class="flex gap-4 text-xs opacity-75">
            <p class="!my-0"><span class="text-red-500">X-component</span> | <span class="text-green-500">Y-component</span> | <span class="text-blue-500">Z-component</span></p>
        </div>
    </div>
</div>