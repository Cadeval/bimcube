import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import useStore from '../../core/store';

export default function Viewport3D() {
  const mountRef = useRef(null);
  const { pluginOutputs, theme, visibility, selectedObject, setSelectedObject } = useStore(); 
  
  // 🪄 NEW: We need persistent references to the camera and controls for our buttons to use!
  const groupRef = useRef(null);
  const sceneRef = useRef(null);
  const gridHelperRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

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
    cameraRef.current = camera; // Save to ref

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.left = '0px'; 
    labelRenderer.domElement.style.pointerEvents = 'none'; 
    currentMount.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls; // Save to ref

    const gridHelper = new THREE.GridHelper(50, 50, '#555555', '#444444');
    gridHelperRef.current = gridHelper;
    scene.add(gridHelper);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event) => {
      if (event.movementX > 2 || event.movementY > 2) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(group.children, true);
      const selectableIntersects = intersects.filter(i => i.object.userData?.isSelectable);

      if (selectableIntersects.length > 0) {
        useStore.getState().setSelectedObject(selectableIntersects[0].object.userData);
      } else {
        useStore.getState().setSelectedObject(null);
      }
    };

    renderer.domElement.addEventListener('click', onMouseClick);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera); 
    };
    animate();

    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      labelRenderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.domElement.removeEventListener('click', onMouseClick);
      window.removeEventListener('resize', handleResize);
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

  // Geometry Generation Loop
  useEffect(() => {
    if (!groupRef.current || !pluginOutputs.renderType) return;
    const group = groupRef.current;
    group.clear(); 

    if (pluginOutputs.renderType === 'floorplan-grid') {
      const wireColor = theme === 'dark' ? '#ffffff' : '#000000';

      if (pluginOutputs.coordinates) {
        const dotGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const dotMat = new THREE.MeshBasicMaterial({ color: '#00d1b2' });
        pluginOutputs.coordinates.forEach(pt => {
          if (visibility.levels[pt.level] && visibility.types[pt.typeId]) {
            const dot = new THREE.Mesh(dotGeom, dotMat);
            dot.position.set(pt.x, pt.y, pt.z);
            group.add(dot);
            const div = document.createElement('div');
            div.className = 'grid-label'; div.textContent = pt.name;
            const label = new CSS2DObject(div); label.position.set(pt.x, pt.y, pt.z);
            group.add(label);
          }
        });
      }

      if (pluginOutputs.slabs) {
        pluginOutputs.slabs.forEach((slab, index) => {
          if (visibility.levels[slab.level] && visibility.types[slab.typeId]) {
            const geom = new THREE.BoxGeometry(slab.width, slab.height, slab.depth);
            const mat = new THREE.MeshStandardMaterial({ color: slab.color, roughness: 0.8 });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(slab.x, slab.y, slab.z);
            mesh.userData = { ...slab, id: `slab-${index}`, isSelectable: true, category: 'Slab' };
            group.add(mesh);
          }
        });
      }

      if (pluginOutputs.walls) {
        pluginOutputs.walls.forEach((wall, index) => {
          if (visibility.levels[wall.level] && visibility.types[wall.typeId]) {
            const geom = new THREE.BoxGeometry(wall.length, wall.height, wall.thickness);
            const mat = new THREE.MeshStandardMaterial({ color: wall.color, roughness: 0.8 });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(wall.x, wall.y, wall.z);
            mesh.rotation.y = wall.rotationY; 
            mesh.userData = { ...wall, id: `wall-${index}`, isSelectable: true, category: 'Wall' };
            const edges = new THREE.EdgesGeometry(geom);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: wireColor, opacity: 0.15, transparent: true }));
            mesh.add(line);
            group.add(mesh);
          }
        });
      }

      if (pluginOutputs.openings) {
        pluginOutputs.openings.forEach((opening, index) => {
          if (visibility.levels[opening.level]) {
            const geom = new THREE.BoxGeometry(opening.width, opening.height, opening.depth);
            const mat = new THREE.MeshStandardMaterial({ 
              color: opening.color, roughness: opening.opacity < 1 ? 0.1 : 0.8, metalness: opening.opacity < 1 ? 0.8 : 0.1,
              transparent: opening.opacity < 1, opacity: opening.opacity
            });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(opening.x, opening.y, opening.z);
            mesh.rotation.y = opening.rotationY; 
            mesh.userData = { ...opening, id: `opening-${index}`, isSelectable: true };
            const edges = new THREE.EdgesGeometry(geom);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: wireColor, opacity: 0.5, transparent: true }));
            mesh.add(line);
            group.add(mesh);
          }
        });
      }
    }
  }, [pluginOutputs, theme, visibility]); 

  // Highlighter Logic
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach(child => {
      if (child.userData?.isSelectable && child.material) {
        if (selectedObject && child.userData.id === selectedObject.id) {
          child.material.emissive.setHex(0x3366ff);
          child.material.emissiveIntensity = 0.6;
        } else {
          child.material.emissive.setHex(0x000000);
        }
      }
    });
  }, [selectedObject, pluginOutputs, visibility]);

  // --- 🪄 CAMERA & NAVIGATION MATH ENGINE 🪄 ---
  const fitCameraToBox = (box) => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Calculate the distance required to fit the box based on Camera FOV
    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * cameraRef.current.fov) / 360));
    const fitWidthDistance = fitHeightDistance / cameraRef.current.aspect;
    const distance = 1.2 * Math.max(fitHeightDistance, fitWidthDistance); // 1.2 adds a nice margin

    // Move camera and target
    const direction = controlsRef.current.target.clone().sub(cameraRef.current.position).normalize().multiplyScalar(distance);
    controlsRef.current.target.copy(center);
    cameraRef.current.position.copy(controlsRef.current.target).sub(direction);
    cameraRef.current.updateProjectionMatrix();
  };

  const handleZoomAll = () => {
    if (!groupRef.current || groupRef.current.children.length === 0) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    fitCameraToBox(box);
  };

  const handleZoomSelected = () => {
    if (!selectedObject || !groupRef.current) return;
    // Find the specific mesh that matches our selected object
    const selectedMesh = groupRef.current.children.find(child => child.userData?.id === selectedObject.id);
    if (selectedMesh) {
      const box = new THREE.Box3().setFromObject(selectedMesh);
      fitCameraToBox(box);
    }
  };

  const handleSetView = (viewType) => {
    if (!cameraRef.current || !controlsRef.current || !groupRef.current) return;
    
    // Find center of the entire building
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.5;

    // Set the target to the center of the building
    controlsRef.current.target.copy(center);

    // Jump camera to specific axis
    if (viewType === 'top') cameraRef.current.position.set(center.x, center.y + distance, center.z + 0.1); // slight offset to prevent gimbal lock
    if (viewType === 'front') cameraRef.current.position.set(center.x, center.y, center.z + distance);
    if (viewType === 'left') cameraRef.current.position.set(center.x - distance, center.y, center.z);
    if (viewType === 'iso') cameraRef.current.position.set(center.x + distance, center.y + distance, center.z + distance);
    
    cameraRef.current.updateProjectionMatrix();
  };

  // UI Styles
  const toolbarStyle = {
    position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10,
    backgroundColor: theme === 'dark' ? 'rgba(24, 24, 24, 0.75)' : 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(10px)', border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
    borderRadius: '8px', display: 'flex', padding: '6px', gap: '4px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
  };

  const btnStyle = {
    background: 'transparent', border: 'none', color: theme === 'dark' ? '#aaa' : '#555', cursor: 'pointer',
    padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '4px', transition: 'all 0.2s'
  };

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      
      {/* 🪄 NEW: FLOATING NAVIGATION TOOLBAR */}
      <div style={toolbarStyle}>
        <button onClick={() => handleSetView('top')} style={btnStyle} onMouseOver={e => e.target.style.color = '#4af626'} onMouseOut={e => e.target.style.color = theme === 'dark' ? '#aaa' : '#555'}>Top</button>
        <button onClick={() => handleSetView('front')} style={btnStyle} onMouseOver={e => e.target.style.color = '#4af626'} onMouseOut={e => e.target.style.color = theme === 'dark' ? '#aaa' : '#555'}>Front</button>
        <button onClick={() => handleSetView('left')} style={btnStyle} onMouseOver={e => e.target.style.color = '#4af626'} onMouseOut={e => e.target.style.color = theme === 'dark' ? '#aaa' : '#555'}>Left</button>
        <button onClick={() => handleSetView('iso')} style={btnStyle} onMouseOver={e => e.target.style.color = '#4af626'} onMouseOut={e => e.target.style.color = theme === 'dark' ? '#aaa' : '#555'}>Iso</button>
        
        <div style={{ width: '1px', backgroundColor: theme === 'dark' ? '#444' : '#ccc', margin: '0 4px' }} />
        
        <button onClick={handleZoomAll} style={btnStyle} onMouseOver={e => e.target.style.color = '#4af626'} onMouseOut={e => e.target.style.color = theme === 'dark' ? '#aaa' : '#555'}>All</button>
        
        {/* Only show "Zoom Selected" if an object is actively clicked! */}
        {selectedObject && (
          <button onClick={handleZoomSelected} style={{...btnStyle, color: '#3366ff'}} onMouseOver={e => e.target.style.color = '#4af626'} onMouseOut={e => e.target.style.color = '#3366ff'}>
            🎯 Fit Selected
          </button>
        )}
      </div>

    </div>
  );
}