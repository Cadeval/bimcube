import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import useStore from '../../core/store';

export default function Viewport3D() {
  const mountRef = useRef(null);
  const pluginOutputs = useStore((state) => state.pluginOutputs);
  const groupRef = useRef(null);

  // 1. Initialize the Three.js Engine
  useEffect(() => {
    // CAPTURE THE MOUNT NODE: This is the fix for the Strict Mode crash!
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#242424');

    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(10, 15, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const gridHelper = new THREE.GridHelper(50, 50, '#555555', '#444444');
    scene.add(gridHelper);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    // Track the animation frame so we can kill it on unmount
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // BULLETPROOF CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId); // 1. Stop the loop
      controls.dispose(); // 2. Clean up controls
      
      // 3. Safely remove the canvas from the captured DOM node
      if (currentMount && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      
      renderer.dispose(); // 4. Clear GPU memory
    };
  }, []);

  // 2. The Reactive Data Loop
  useEffect(() => {
    if (!groupRef.current || !pluginOutputs.coordinates) return;

    const group = groupRef.current;
    group.clear(); 

    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: '#4af626' }); 

    pluginOutputs.coordinates.forEach(pt => {
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(pt.x - 5, pt.z, pt.y - 5); 
      group.add(sphere);
    });

  }, [pluginOutputs]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}