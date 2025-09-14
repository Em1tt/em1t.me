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
    let isPaused = $state(false);
    let isHovering = false;
    
    // 3D Points
    const pointA = { x: 0, y: 0, z: 0 }; // Origin point
    let pointB = { x: 2, y: 1, z: 1 }; // Moving point
    let pointC = { x: 0, y: 0, z: 0 }; // Projection point for XY plane
    let pointD = { x: 0, y: 0, z: 0 }; // Projection point for X axis
    
    // Three.js objects
    let sphereA: THREE.Mesh;
    let sphereB: THREE.Mesh;
    let sphereC: THREE.Mesh;
    let sphereD: THREE.Mesh;
    let distanceLine: THREE.Line;
    let projectionLines: THREE.Group;
    let triangleADB: THREE.Mesh;
    let gridHelper: THREE.GridHelper;
    let axesHelper: THREE.AxesHelper;
    let labelA: THREE.Sprite;
    let labelB: THREE.Sprite;
    let labelC: THREE.Sprite;
    let labelD: THREE.Sprite;

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

    function createTextSprite(text: string, color: string = '#ffffff', opacity: number = 1.0): THREE.Sprite {
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
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: opacity
        });
        return new THREE.Sprite(material);
    }

    function updateScene() {
        if (!scene) return;
        
        // Update projection points
        pointC.x = pointB.x;
        pointC.y = pointA.y; // Same Y as point A (same level as D)
        pointC.z = pointB.z; // Same Z as point B (underneath B)
        
        pointD.x = pointB.x;
        pointD.y = pointA.y; // Same Y as point A
        pointD.z = pointA.z; // Same Z as point A (X axis projection)
        
        // Update sphere positions
        sphereB.position.set(pointB.x, pointB.y, pointB.z);
        sphereC.position.set(pointC.x, pointC.y, pointC.z);
        sphereD.position.set(pointD.x, pointD.y, pointD.z);
        
        // Update distance line (main diagonal)
        const points = [
            new THREE.Vector3(pointA.x, pointA.y, pointA.z),
            new THREE.Vector3(pointB.x, pointB.y, pointB.z)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        distanceLine.geometry.dispose();
        distanceLine.geometry = geometry;
        
        // Update projection lines (showing 3D components)
        projectionLines.clear();
        
        // X component (A to D - red)
        const xLine = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pointA.x, pointA.y, pointA.z),
            new THREE.Vector3(pointD.x, pointD.y, pointD.z)
        ]);
        const xLineMesh = new THREE.Line(xLine, new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 }));
        projectionLines.add(xLineMesh);
        
        // Z component (D to C - blue)  
        const zLine = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pointD.x, pointD.y, pointD.z),
            new THREE.Vector3(pointC.x, pointC.y, pointC.z)
        ]);
        const zLineMesh = new THREE.Line(zLine, new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 }));
        projectionLines.add(zLineMesh);
        
        // Y component (C to B - green)
        const yLine = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pointC.x, pointC.y, pointC.z),
            new THREE.Vector3(pointB.x, pointB.y, pointB.z)
        ]);
        const yLineMesh = new THREE.Line(yLine, new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 }));
        projectionLines.add(yLineMesh);
        
        // Update triangle ACB (semi-transparent)
        if (triangleADB) {
            scene.remove(triangleADB);
            triangleADB.geometry.dispose();
        }
        
        const triangleGeometry = new THREE.BufferGeometry();
        const triangleVertices = new Float32Array([
            pointA.x, pointA.y, pointA.z,  // A
            pointC.x, pointC.y, pointC.z,  // C
            pointB.x, pointB.y, pointB.z   // B
        ]);
        triangleGeometry.setAttribute('position', new THREE.BufferAttribute(triangleVertices, 3));
        
        // Use MeshBasicMaterial to ignore scene lighting - always lit up
        const triangleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x666666,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        triangleADB = new THREE.Mesh(triangleGeometry, triangleMaterial);
        scene.add(triangleADB);
        
        // Update labels
        labelB.position.set(pointB.x + 0.2, pointB.y + 0.2, pointB.z + 0.2);
        labelC.position.set(pointC.x + 0.2, pointC.y + 0.2, pointC.z - 0.3);
        labelD.position.set(pointD.x + 0.2, pointD.y - 0.3, pointD.z + 0.2);
        
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
        // Transparent background
        
        // Camera - zoomed in for better readability
        camera = new THREE.PerspectiveCamera(60, 768 / 480, 0.1, 1000);
        camera.position.set(2.5, 2.8, 4);
        camera.lookAt(1, 1, 1);
        
        // Renderer with transparent background
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0); // Transparent background
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
        
        // Grid and axes with #10182b color
        gridHelper = new THREE.GridHelper(6, 12, 0x10182b, 0x10182b);
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
        
        // Point C (XY plane projection) - cyan/blue color
        sphereC = new THREE.Mesh(
            sphereGeometry,
            new THREE.MeshLambertMaterial({ color: 0x00bcd4, transparent: true, opacity: 0.5 })
        );
        sphereC.castShadow = true;
        scene.add(sphereC);
        
        // Point D (X axis projection) - yellow/orange color
        sphereD = new THREE.Mesh(
            sphereGeometry,
            new THREE.MeshLambertMaterial({ color: 0xffa726, transparent: true, opacity: 0.5 })
        );
        sphereD.castShadow = true;
        scene.add(sphereD);
        
        // Distance line - white color
        const lineGeometry = new THREE.BufferGeometry();
        distanceLine = new THREE.Line(
            lineGeometry,
            new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
        );
        scene.add(distanceLine);
        
        // Projection lines group
        projectionLines = new THREE.Group();
        scene.add(projectionLines);
        
        // Labels - larger scale for better readability
        labelA = createTextSprite('A', '#ff3b3b');
        labelA.position.set(pointA.x + 0.2, pointA.y + 0.2, pointA.z + 0.2);
        labelA.scale.set(0.8, 0.4, 1);
        scene.add(labelA);
        
        labelB = createTextSprite('B', '#10b951');
        labelB.scale.set(0.8, 0.4, 1);
        scene.add(labelB);
        
        labelC = createTextSprite('C', '#00bcd4', 0.5);
        labelC.scale.set(0.8, 0.4, 1);
        scene.add(labelC);
        
        labelD = createTextSprite('D', '#ffa726', 0.5);
        labelD.scale.set(0.8, 0.4, 1);
        scene.add(labelD);
        
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
        if (triangleADB) {
            triangleADB.geometry.dispose();
            if (Array.isArray(triangleADB.material)) {
                triangleADB.material.forEach(material => material.dispose());
            } else {
                triangleADB.material.dispose();
            }
        }
    });
</script>

<div class="flex w-full items-center flex-col">
    <div class="relative">
        <canvas bind:this={canvas} class="border border-gray-300 rounded-lg"></canvas>
        
        <!-- Pause button positioned at top right -->
        <button 
            class="absolute top-2 right-2 px-3 py-1 text-xs font-bold text-white rounded-md transition-colors duration-200 {isPaused ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}"
            onclick={togglePause}
        >
            {isPaused ? 'Play' : 'Pause'}
        </button>
    </div>

    <div class="mt-4 space-y-2 text-sm">
        <p class="!my-0">3D Distance: <span class="font-bold">{distance}</span></p>
        <div class="grid grid-cols-2 gap-2 text-xs">
            <p class="!my-0">Point A: <span class="text-red-500 font-mono">(0, 0, 0)</span></p>
            <p class="!my-0">Point B: <span class="text-green-500 font-mono">({x/100}, {y/100}, {z/100})</span></p>
            <p class="!my-0">Point C: <span class="text-cyan-400 font-mono">({x/100}, 0, {z/100})</span></p>
            <p class="!my-0">Point D: <span class="text-orange-400 font-mono">({x/100}, 0, 0)</span></p>
        </div>
    </div>
</div>