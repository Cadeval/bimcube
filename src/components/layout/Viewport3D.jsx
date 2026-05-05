import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import useStore from '../../core/store';

export default function Viewport3D() {
  const mountRef = useRef(null);
  
  // Pull our new selection state into the viewer
  const { pluginOutputs, theme, visibility, selectedObject, setSelectedObject } = useStore(); 
  
  const groupRef = useRef(null);
  const sceneRef = useRef(null);
  const gridHelperRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme === 'dark' ? '#242424' : '#e0e0e0');
    sceneRef.current = scene;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(20, 15, 20);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.left = '0px'; 
    labelRenderer.domElement.style.pointerEvents = 'none'; 
    currentMount.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const gridHelper = new THREE.GridHelper(50, 50, '#555555', '#444444');
    gridHelperRef.current = gridHelper;
    scene.add(gridHelper);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    // --- 🪄 THE RAYCASTER (Virtual Laser Beam) 🪄 ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event) => {
      // Don't register clicks if we are rotating the camera (simple drag check)
      if (event.movementX > 2 || event.movementY > 2) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check what the laser hits inside our geometry group
      const intersects = raycaster.intersectObjects(group.children, true);
      
      // Filter out lines and grid dots, only select objects with our custom 'isSelectable' tag
      const selectableIntersects = intersects.filter(i => i.object.userData?.isSelectable);

      if (selectableIntersects.length > 0) {
        // Hit! Send the object's data up to the global store
        useStore.getState().setSelectedObject(selectableIntersects[0].object.userData);
      } else {
        // Missed! Clicked on empty space, deselect.
        useStore.getState().setSelectedObject(null);
      }
    };

    // Listen for clicks on the 3D Canvas
    renderer.domElement.addEventListener('click', onMouseClick);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera); 
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.domElement.removeEventListener('click', onMouseClick);
      if (currentMount && currentMount.contains(renderer.domElement)) currentMount.removeChild(renderer.domElement);
      if (currentMount && currentMount.contains(labelRenderer.domElement)) currentMount.removeChild(labelRenderer.domElement);
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !gridHelperRef.current) return;
    sceneRef.current.background = new THREE.Color(theme === 'dark' ? '#242424' : '#e0e0e0');
    gridHelperRef.current.material.color.set(theme === 'dark' ? '#555555' : '#aaaaaa');
  }, [theme]);

  // REACTIVE DATA LOOP: Building the Geometry & Tagging it!
  useEffect(() => {
    if (!groupRef.current || !pluginOutputs.renderType) return;
    const group = groupRef.current;
    group.clear(); 

    if (pluginOutputs.renderType === 'floorplan-grid') {
      const wireColor = theme === 'dark' ? '#ffffff' : '#000000';

      // 1. GRID LAYER
      if (pluginOutputs.coordinates) {
        const dotGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const dotMat = new THREE.MeshBasicMaterial({ color: '#00d1b2' });
        
        pluginOutputs.coordinates.forEach(pt => {
          if (visibility.levels[pt.level] && visibility.types[pt.typeId]) {
            const dot = new THREE.Mesh(dotGeom, dotMat);
            dot.position.set(pt.x, pt.y, pt.z);
            group.add(dot);
            
            const div = document.createElement('div');
            div.className = 'grid-label';
            div.textContent = pt.name;
            const label = new CSS2DObject(div);
            label.position.set(pt.x, pt.y, pt.z);
            group.add(label);
          }
        });
      }

      // 2. SLABS LAYER
      if (pluginOutputs.slabs) {
        pluginOutputs.slabs.forEach((slab, index) => {
          if (visibility.levels[slab.level] && visibility.types[slab.typeId]) {
            const geom = new THREE.BoxGeometry(slab.width, slab.height, slab.depth);
            const mat = new THREE.MeshStandardMaterial({ color: slab.color, roughness: 0.8 });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(slab.x, slab.y, slab.z);
            
            // TAG FOR RAYCASTER
            mesh.userData = { ...slab, id: `slab-${index}`, isSelectable: true, category: 'Slab' };
            group.add(mesh);
          }
        });
      }

      // 3. WALLS LAYER
      if (pluginOutputs.walls) {
        // 👇 FIX 1: Add 'index' to the forEach loop
        pluginOutputs.walls.forEach((wall, index) => {
          if (visibility.levels[wall.level] && visibility.types[wall.typeId]) {
            const geom = new THREE.BoxGeometry(wall.length, wall.height, wall.thickness);
            const mat = new THREE.MeshStandardMaterial({ color: wall.color, roughness: 0.8 });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(wall.x, wall.y, wall.z);
            mesh.rotation.y = wall.rotationY; 
            
            // 👇 FIX 2: Attach a unique 'id' using the index!
            mesh.userData = { ...wall, id: `wall-${index}`, isSelectable: true, category: 'Wall' };

            const edges = new THREE.EdgesGeometry(geom);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: wireColor, opacity: 0.15, transparent: true }));
            mesh.add(line);
            
            group.add(mesh);
          }
        });
      }
    }
  }, [pluginOutputs, theme, visibility]); 

  // --- 💡 DYNAMIC HIGHLIGHTER (Runs whenever selection changes) ---
  useEffect(() => {
    if (!groupRef.current) return;
    
    groupRef.current.children.forEach(child => {
      // Make sure we only touch our selectable walls/slabs
      if (child.userData?.isSelectable && child.material) {
        if (selectedObject && child.userData.id === selectedObject.id) {
          // GLOOOOW BLUE!
          child.material.emissive.setHex(0x3366ff);
          child.material.emissiveIntensity = 0.6;
        } else {
          // Reset to normal
          child.material.emissive.setHex(0x000000);
        }
      }
    });
  }, [selectedObject, pluginOutputs, visibility]); // Re-run if selection or geometry changes

  return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
}