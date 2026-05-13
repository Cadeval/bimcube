import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'; 
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js'; 
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import useStore from '../../core/store';

export default function Viewport3D() {
  const mountRef = useRef(null);
  
  const { 
    pluginOutputs, theme, visibility, selectedObject, clipping, 
    mainViewMode, active2DView, cameraViewTrigger, exportTrigger 
  } = useStore();
  
  const groupRef = useRef(null);
  const sceneRef = useRef(null);
  const gridHelperRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null); 
  
  const perspCamRef = useRef(null);
  const orthoCamRef = useRef(null);
  const cameraRef = useRef(null); 
  const arButtonRef = useRef(null); 

  const uiClipPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.5)); 
  const viewClipPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000)); 

  // 1. INITIALIZE SCENE & CAMERAS
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-20, 10, -20);
    scene.add(fillLight);

    const aspect = currentMount.clientWidth / currentMount.clientHeight;
    
    perspCamRef.current = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    perspCamRef.current.position.set(20, 15, 20);
    
    const frustum = 15; 
    orthoCamRef.current = new THREE.OrthographicCamera(-frustum*aspect, frustum*aspect, frustum, -frustum, -100, 1000);
    
    cameraRef.current = perspCamRef.current; 

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.localClippingEnabled = true; 
    renderer.xr.enabled = true; 
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    const arBtn = ARButton.createButton(renderer);
    arBtn.style.display = 'none'; 
    arButtonRef.current = arBtn;
    document.body.appendChild(arBtn);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.left = '0px'; 
    labelRenderer.domElement.style.pointerEvents = 'none'; 
    currentMount.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(cameraRef.current, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls; 

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
      
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(group.children, true).filter(i => {
         if (!i.object.userData?.isSelectable) return false;
         if (clipping.enabled && uiClipPlaneRef.current.distanceToPoint(i.point) < 0) return false;
         if (mainViewMode === '2D' && viewClipPlaneRef.current.distanceToPoint(i.point) < 0) return false;
         return true;
      });

      if (intersects.length > 0) {
        useStore.getState().setSelectedObject(intersects[0].object.userData);
      } else {
        useStore.getState().setSelectedObject(null);
      }
    };

    renderer.domElement.addEventListener('click', onMouseClick);

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, cameraRef.current);
      labelRenderer.render(scene, cameraRef.current); 
    });

    const handleResize = () => {
      const newAspect = currentMount.clientWidth / currentMount.clientHeight;
      perspCamRef.current.aspect = newAspect;
      perspCamRef.current.updateProjectionMatrix();
      orthoCamRef.current.left = -frustum * newAspect;
      orthoCamRef.current.right = frustum * newAspect;
      orthoCamRef.current.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      labelRenderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      renderer.setAnimationLoop(null);
      if (document.body.contains(arBtn)) document.body.removeChild(arBtn);
      controls.dispose();
      renderer.domElement.removeEventListener('click', onMouseClick);
      window.removeEventListener('resize', handleResize);
      if (currentMount && currentMount.contains(renderer.domElement)) currentMount.removeChild(renderer.domElement);
      if (currentMount && currentMount.contains(labelRenderer.domElement)) currentMount.removeChild(labelRenderer.domElement);
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. SHOW AR BUTTON
  useEffect(() => {
    if (arButtonRef.current) {
        arButtonRef.current.style.display = mainViewMode === 'AR' ? 'block' : 'none';
    }
  }, [mainViewMode]);

  // 3. UI CLIPPING PLANE
  useEffect(() => {
    if (!rendererRef.current) return;
    if (!clipping.enabled) {
        uiClipPlaneRef.current.constant = 1000; 
        return;
    }
    if (clipping.axis === 'y') uiClipPlaneRef.current.normal.set(0, -1, 0); 
    else if (clipping.axis === 'x') uiClipPlaneRef.current.normal.set(-1, 0, 0); 
    else if (clipping.axis === 'z') uiClipPlaneRef.current.normal.set(0, 0, -1); 
    uiClipPlaneRef.current.constant = clipping.distance;
  }, [clipping]);

  // 4. THE 2D MODE SWITCHER ENGINE & GIMBAL LOCK FIX
  useEffect(() => {
    if (!controlsRef.current || !groupRef.current) return;
    const controls = controlsRef.current;
    
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());

    if (mainViewMode === '3D' || mainViewMode === 'AR') { 
        cameraRef.current = perspCamRef.current;
        controls.object = perspCamRef.current;
        controls.enableRotate = true; 
        controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
        viewClipPlaneRef.current.constant = 1000; 

    } else if (mainViewMode === '2D') {
        cameraRef.current = orthoCamRef.current;
        controls.object = orthoCamRef.current;
        controls.enableRotate = false; 
        controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
        
        controls.target.copy(center);

        // 🪄 Auto-Scale the 2D View to fit the building!
        if (mountRef.current) {
            const maxSize = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z) || 10;
            const f = maxSize * 0.6;
            const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            orthoCamRef.current.left = -f * aspect;
            orthoCamRef.current.right = f * aspect;
            orthoCamRef.current.top = f;
            orthoCamRef.current.bottom = -f;
        }

        if (active2DView.startsWith('Floorplan')) {
            const lvl = parseInt(active2DView.split('-')[1]);
            const pt = pluginOutputs.coordinates?.find(p => p.level === lvl);
            const cutY = pt ? pt.y + 1.2 : 1.2; 
            // 🪄 GIMBAL LOCK FIX: Add +0.1 to Z so the camera knows which way is up!
            orthoCamRef.current.position.set(center.x, center.y + 50, center.z + 0.1); 
            viewClipPlaneRef.current.normal.set(0, -1, 0); 
            viewClipPlaneRef.current.constant = cutY;
        } else if (active2DView.startsWith('Section-X')) {
            const gridName = active2DView.split('-')[2];
            const pt = pluginOutputs.coordinates?.find(p => p.name.startsWith(gridName));
            const cutX = pt ? pt.x : 0;
            orthoCamRef.current.position.set(cutX - 50, center.y, center.z); 
            viewClipPlaneRef.current.normal.set(1, 0, 0); 
            viewClipPlaneRef.current.constant = -cutX;
        } else if (active2DView.startsWith('Section-Z')) {
            const gridName = active2DView.split('-')[2];
            const pt = pluginOutputs.coordinates?.find(p => p.name.endsWith(gridName));
            const cutZ = pt ? pt.z : 0;
            orthoCamRef.current.position.set(center.x, center.y, cutZ + 50); 
            viewClipPlaneRef.current.normal.set(0, 0, -1); 
            viewClipPlaneRef.current.constant = cutZ;
        }
        orthoCamRef.current.updateProjectionMatrix();
    }
  }, [mainViewMode, active2DView, pluginOutputs]);

  // 5. HIDE GRID IN 2D / AR MODE
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.background = null; 
    if (gridHelperRef.current) sceneRef.current.remove(gridHelperRef.current);
    
    if (mainViewMode !== '2D' && mainViewMode !== 'AR') {
      const mainColor = theme === 'dark' ? '#555555' : '#bbbbbb';
      const subColor = theme === 'dark' ? '#333333' : '#e0e0e0';
      const gridHelper = new THREE.GridHelper(50, 50, mainColor, subColor);
      gridHelperRef.current = gridHelper;
      sceneRef.current.add(gridHelper);
    }
  }, [theme, mainViewMode]);

  // 6. THE ARCHITECTURAL GEOMETRY & MATERIAL ENGINE
  useEffect(() => {
    if (!groupRef.current || !pluginOutputs.renderType) return;
    const group = groupRef.current;
    group.clear(); 

    const is2D = mainViewMode === '2D'; 
    const isFloorplan = is2D && active2DView.startsWith('Floorplan');
    const activeLvl = isFloorplan ? parseInt(active2DView.split('-')[1]) : -1;

    if (pluginOutputs.renderType === 'floorplan-grid') {
      const wireColor = theme === 'dark' ? '#ffffff' : '#000000';
      const clipPlanes = [uiClipPlaneRef.current, viewClipPlaneRef.current];

      if (pluginOutputs.coordinates) {
        const dotGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const dotMat = new THREE.MeshBasicMaterial({ color: '#00d1b2', clippingPlanes: clipPlanes });
        pluginOutputs.coordinates.forEach(pt => {
          if (visibility.levels[pt.level] && visibility.types[pt.typeId]) {
            if (isFloorplan && pt.level > activeLvl) return;

            const dot = new THREE.Mesh(dotGeom, dotMat);
            dot.position.set(pt.x, pt.y, pt.z);
            group.add(dot);
            
            if (!is2D && mainViewMode !== 'AR') { 
              const div = document.createElement('div');
              div.className = 'grid-label'; div.textContent = pt.name;
              const label = new CSS2DObject(div); label.position.set(pt.x, pt.y, pt.z);
              group.add(label);
            }
          }
        });
      }

      if (pluginOutputs.slabs) {
        pluginOutputs.slabs.forEach((slab, index) => {
          if (visibility.levels[slab.level] && visibility.types[slab.typeId]) {
            if (isFloorplan && slab.level > activeLvl) return; 

            const geom = new THREE.BoxGeometry(slab.width, slab.height, slab.depth);
            
            const mat = isFloorplan 
                ? new THREE.MeshBasicMaterial({ color: theme === 'dark' ? '#222222' : '#f0f0f0', side: THREE.DoubleSide, clippingPlanes: clipPlanes })
                : new THREE.MeshStandardMaterial({ color: slab.color, roughness: 0.8, side: THREE.DoubleSide, clippingPlanes: clipPlanes });

            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(slab.x, slab.y, slab.z);
            mesh.userData = { ...slab, id: `slab-${index}`, isSelectable: true, category: 'Slab', baseColorHex: mat.color.getHex() };
            group.add(mesh);
          }
        });
      }

      if (pluginOutputs.walls) {
        pluginOutputs.walls.forEach((wall, index) => {
          if (visibility.levels[wall.level] && visibility.types[wall.typeId]) {
            if (isFloorplan && wall.level > activeLvl) return; 

            const geom = new THREE.BoxGeometry(wall.length, wall.height, wall.thickness);
            
            const isGlassPanel = wall.id.includes('Glass');
            const isGroundGlass = wall.id.includes('L0-Glass');
            const isStud = wall.id.includes('GroundStud');
            
            let finalRoughness = wall.opacity < 1 ? 0.15 : 0.8;
            let finalMetalness = wall.opacity < 1 ? 0.85 : 0.1;

            if (isGlassPanel) {
                finalRoughness = isGroundGlass ? 0.05 : 0.15; 
                finalMetalness = isGroundGlass ? 0.95 : 0.85; 
            } else if (isStud) {
                finalRoughness = 0.3; 
                finalMetalness = 0.8; 
            }
            
            let mat;
            if (isFloorplan) {
               const pochéColor = theme === 'dark' ? '#dddddd' : '#222222';
               mat = new THREE.MeshBasicMaterial({ 
                   color: isGlassPanel ? '#8ab4f8' : pochéColor, 
                   transparent: isGlassPanel, opacity: isGlassPanel ? 0.4 : 1, 
                   side: THREE.DoubleSide, 
                   clippingPlanes: clipPlanes 
               });
            } else {
               mat = new THREE.MeshStandardMaterial({ 
                  color: wall.color, roughness: finalRoughness, metalness: finalMetalness,
                  transparent: wall.opacity < 1, opacity: wall.opacity || 1, 
                  side: THREE.DoubleSide, 
                  clippingPlanes: clipPlanes 
               });
            }

            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(wall.x, wall.y, wall.z);
            mesh.rotation.y = wall.rotationY; 
            mesh.userData = { ...wall, id: `wall-${index}`, isSelectable: true, category: isStud ? 'Mullion' : 'Wall', baseColorHex: mat.color.getHex() };
            
            if (!isStud) {
                const edges = new THREE.EdgesGeometry(geom);
                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: isFloorplan ? (theme==='dark'?'#222':'#fff') : wireColor, opacity: isFloorplan ? 0.3 : 0.15, transparent: true, clippingPlanes: clipPlanes }));
                mesh.add(line);
            }
            group.add(mesh);
          }
        });
      }

      if (pluginOutputs.openings) {
        pluginOutputs.openings.forEach((opening, index) => {
          if (visibility.levels[opening.level] && visibility.types[opening.typeId]) {
            if (isFloorplan && opening.level > activeLvl) return;

            const geom = new THREE.BoxGeometry(opening.width, opening.height, opening.depth);
            const isGlassOp = opening.category === 'Window';
            
            const mat = isFloorplan
                ? new THREE.MeshBasicMaterial({ color: '#8ab4f8', transparent: true, opacity: 0.4, side: THREE.DoubleSide, clippingPlanes: clipPlanes })
                : new THREE.MeshStandardMaterial({ color: opening.color, roughness: isGlassOp ? 0.15 : 0.8, metalness: isGlassOp ? 0.85 : 0.1, transparent: opening.opacity < 1, opacity: opening.opacity, side: THREE.DoubleSide, clippingPlanes: clipPlanes });
            
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(opening.x, opening.y, opening.z);
            mesh.rotation.y = opening.rotationY; 
            mesh.userData = { ...opening, id: `opening-${index}`, isSelectable: true, baseColorHex: mat.color.getHex() };
            const edges = new THREE.EdgesGeometry(geom);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: isFloorplan ? (theme==='dark'?'#222':'#fff') : wireColor, opacity: isFloorplan ? 0.5 : 0.5, transparent: true, clippingPlanes: clipPlanes }));
            mesh.add(line);
            group.add(mesh);
          }
        });
      }
    }
  }, [pluginOutputs, theme, visibility, mainViewMode, active2DView]); 

  // 7. SAFE HIGHLIGHTING ENGINE
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach(child => {
      if (child.userData?.isSelectable && child.material) {
        if (selectedObject && child.userData.id === selectedObject.id) {
          if (child.material.emissive) {
            child.material.emissive.setHex(0x3366ff);
            child.material.emissiveIntensity = 0.6;
          } else if (child.material.color) {
            child.material.color.setHex(0x3366ff);
          }
        } else {
          if (child.material.emissive) {
            child.material.emissive.setHex(0x000000);
          } else if (child.userData.baseColorHex !== undefined) {
            child.material.color.setHex(child.userData.baseColorHex);
          }
        }
      }
    });
  }, [selectedObject, pluginOutputs, visibility, mainViewMode]);

  // 8. CAMERA SNAPPING TRIGGER
  useEffect(() => {
    if (cameraViewTrigger?.view) handleSetView(cameraViewTrigger.view);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraViewTrigger]);

  const fitCameraToBox = (box) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z) || 10;
    
    if (mainViewMode === '2D' && orthoCamRef.current) {
        const f = maxSize * 0.6;
        const aspect = orthoCamRef.current.right / orthoCamRef.current.top;
        orthoCamRef.current.left = -f * aspect; orthoCamRef.current.right = f * aspect;
        orthoCamRef.current.top = f; orthoCamRef.current.bottom = -f;
        orthoCamRef.current.updateProjectionMatrix();
        controlsRef.current.target.copy(center);
    } else {
        const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * cameraRef.current.fov) / 360));
        const fitWidthDistance = fitHeightDistance / cameraRef.current.aspect;
        const distance = 1.2 * Math.max(fitHeightDistance, fitWidthDistance);
        const direction = controlsRef.current.target.clone().sub(cameraRef.current.position).normalize().multiplyScalar(distance);
        controlsRef.current.target.copy(center);
        cameraRef.current.position.copy(controlsRef.current.target).sub(direction);
        cameraRef.current.updateProjectionMatrix();
    }
  };

  const handleZoomAll = () => {
    if (!groupRef.current || groupRef.current.children.length === 0) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    fitCameraToBox(box);
  };

  const handleZoomSelected = () => {
    if (!selectedObject || !groupRef.current) return;
    const selectedMesh = groupRef.current.children.find(child => child.userData?.id === selectedObject.id);
    if (selectedMesh) fitCameraToBox(new THREE.Box3().setFromObject(selectedMesh));
  };

  const handleSetView = (viewType) => {
    if (!cameraRef.current || !controlsRef.current || !groupRef.current) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    const size = box.isEmpty() ? new THREE.Vector3(10,10,10) : box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 10;
    const distance = maxDim * 1.5;

    controlsRef.current.target.copy(center);
    
    if (viewType === 'top') cameraRef.current.position.set(center.x, center.y + distance, center.z + 0.1); 
    if (viewType === 'bottom') cameraRef.current.position.set(center.x, center.y - distance, center.z + 0.1); 
    if (viewType === 'front') cameraRef.current.position.set(center.x, center.y, center.z + distance);
    if (viewType === 'back') cameraRef.current.position.set(center.x, center.y, center.z - distance);
    if (viewType === 'left') cameraRef.current.position.set(center.x - distance, center.y, center.z);
    if (viewType === 'right') cameraRef.current.position.set(center.x + distance, center.y, center.z);
    if (viewType === 'iso') cameraRef.current.position.set(center.x + distance, center.y + distance, center.z + distance);
    
    cameraRef.current.updateProjectionMatrix();
  };

  // 9. THE EXPORT ENGINE
  useEffect(() => {
    if (!exportTrigger || !groupRef.current) return;

    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);

    const saveFile = (blob, filename) => {
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    };

    if (exportTrigger.format === 'gltf') {
      const exporter = new GLTFExporter();
      exporter.parse(
        groupRef.current,
        (gltf) => {
          const blob = new Blob([gltf], { type: 'application/octet-stream' });
          saveFile(blob, `BimCube_Model_${Date.now()}.glb`);
        },
        (error) => console.error('GLTF Export Error:', error),
        { binary: true } 
      );
    } else if (exportTrigger.format === 'obj') {
      const exporter = new OBJExporter();
      const result = exporter.parse(groupRef.current);
      const blob = new Blob([result], { type: 'text/plain' });
      saveFile(blob, `BimCube_Geometry_${Date.now()}.obj`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportTrigger]);

  const isDark = theme === 'dark';
  
  // 🪄 10. SAFE, UNIFIED RETURN BLOCK
  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      
      {mainViewMode === 'AR' && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', padding: '2rem', backgroundColor: isDark ? 'rgba(24,24,24,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: `1px solid ${isDark ? '#444' : '#ddd'}`, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', pointerEvents: 'none' }}>
          <h2 style={{ color: isDark ? '#fff' : '#111', marginBottom: '1rem', fontWeight: '900' }}>👓 Ready for AR</h2>
          <p style={{ color: isDark ? '#aaa' : '#666', marginBottom: '0.5rem' }}>1. Ensure you are on a compatible mobile device.</p>
          <p style={{ color: isDark ? '#aaa' : '#666', marginBottom: '0.5rem' }}>2. Click the <strong>START AR</strong> button below.</p>
          <p style={{ color: isDark ? '#aaa' : '#666' }}>3. Point your camera at the floor to place the building!</p>
        </div>
      )}

      {mainViewMode === '3D' && (
        <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, backgroundColor: isDark ? 'rgba(24, 24, 24, 0.75)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', border: `1px solid ${isDark ? '#333' : '#ddd'}`, borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '6px', gap: '4px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          <button onClick={handleZoomAll} style={{ background: 'transparent', border: 'none', color: isDark ? '#aaa' : '#666', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '4px', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.color = '#4af626'} onMouseOut={e => e.target.style.color = isDark ? '#aaa' : '#666'}>
            🔍 Fit All
          </button>
          {selectedObject && (
            <button onClick={handleZoomSelected} style={{ background: 'transparent', border: 'none', color: '#3366ff', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '4px', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.color = '#4af626'} onMouseOut={e => e.target.style.color = '#3366ff'}>
              🎯 Fit Selected
            </button>
          )}
        </div>
      )}
    </div>
  );
}