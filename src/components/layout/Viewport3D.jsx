import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import useStore from '../../core/store';

export default function Viewport3D() {
  const mountRef = useRef(null);
  const pluginOutputs = useStore((state) => state.pluginOutputs);
  const groupRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#242424');

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(20, 15, 20);

    // 1. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    // 2. CSS2D (Text) Renderer
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.left = '0px'; // <-- FIX: Aligns text canvas to the left
    labelRenderer.domElement.style.pointerEvents = 'none'; // Let clicks pass through to orbit controls
    currentMount.appendChild(labelRenderer.domElement);

    // 3. OrbitControls (Attach to the WebGL canvas, since labelRenderer passes clicks through)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const gridHelper = new THREE.GridHelper(50, 50, '#555555', '#444444');
    scene.add(gridHelper);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera); // Render the HTML text!
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      if (currentMount && currentMount.contains(renderer.domElement)) currentMount.removeChild(renderer.domElement);
      if (currentMount && currentMount.contains(labelRenderer.domElement)) currentMount.removeChild(labelRenderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Reactive Data Loop
  useEffect(() => {
    if (!groupRef.current || !pluginOutputs.renderType) return;
    const group = groupRef.current;
    group.clear(); 

    const baseColor = pluginOutputs.color || '#4af626';

    // 🟢 RENDER DOTS
    if (pluginOutputs.renderType === 'points') {
      const geometry = new THREE.SphereGeometry(0.2, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: baseColor }); 
      pluginOutputs.coordinates.forEach(pt => {
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(pt.x - 5, pt.z, pt.y - 5); 
        group.add(sphere);
      });
    } 
    // 📦 RENDER BOX
    else if (pluginOutputs.renderType === 'box') {
      const { width, height, depth } = pluginOutputs.dimensions;
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.3 });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(0, height / 2, 0); 
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.2 }));
      box.add(line);
      group.add(box);
    }
    // 🏢 RENDER NEW FLOORPLAN GRID WITH TEXT!
    else if (pluginOutputs.renderType === 'floorplan-grid') {
      const { widthX, depthY } = pluginOutputs.dimensions;
      const dotGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const dotMat = new THREE.MeshBasicMaterial({ color: '#00d1b2' });

      pluginOutputs.coordinates.forEach(pt => {
        // Center the grid around origin (0,0,0)
        const posX = pt.x - (widthX / 2);
        const posZ = pt.z - (depthY / 2);
        const posY = pt.y; // Height

        // 1. Add the 3D dot
        const dot = new THREE.Mesh(dotGeom, dotMat);
        dot.position.set(posX, posY, posZ);
        group.add(dot);

        // 2. Add the floating HTML Label
        const div = document.createElement('div');
        div.className = 'grid-label';
        div.textContent = pt.name;
        
        const label = new CSS2DObject(div);
        label.position.set(posX, posY, posZ);
        group.add(label);
      });
    }

  }, [pluginOutputs]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
}