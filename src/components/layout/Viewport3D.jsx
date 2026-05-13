import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'; 
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js'; 
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

  const uiClipPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.5)); 
  const viewClipPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000)); 

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
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

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

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, cameraRef.current);
      labelRenderer.render(scene, cameraRef.current); 
    };
    animate();

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

  useEffect(() => {
    if (!controlsRef.current || !groupRef.current) return;
    const controls = controlsRef.current;
    
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());

    if (mainViewMode === '3D') {
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

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.background = null; 
    if (gridHelperRef.current) sceneRef.current.remove(gridHelperRef.current);
    
    if (mainViewMode !== '2D') {
      const mainColor = theme === 'dark' ? '#555555' : '#bbbbbb';
      const subColor = theme === 'dark' ? '#333333' : '#e0e0e0';
      const gridHelper = new THREE.GridHelper(50, 50, mainColor, subColor);
      gridHelperRef.current = gridHelper;
      sceneRef.current.add(gridHelper);
    }
  }, [theme, mainViewMode]);

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
            
            if (!is2D) { 
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

      if (pluginOutputs.rooms) {
        pluginOutputs.rooms.forEach((room, index) => {
          if (visibility.levels[room.level] && visibility.types[room.typeId]) {
            if (isFloorplan && room.level > activeLvl) return;

            const shape = new THREE.Shape();
            room.points.forEach((pt, i) => {
              if (i === 0) shape.moveTo(pt.x, -pt.z);
              else shape.lineTo(pt.x, -pt.z);
            });

            const extrudeSettings = { depth: room.height, bevelEnabled: false };
            const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geom.rotateX(-Math.PI / 2); 

            const mat = isFloorplan 
                ? new THREE.MeshBasicMaterial({ color: room.color, opacity: 0.6, transparent: true, side: THREE.DoubleSide, clippingPlanes: clipPlanes })
                : new THREE.MeshStandardMaterial({ color: room.color, opacity: 0.15, transparent: true, side: THREE.DoubleSide, clippingPlanes: clipPlanes });

            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(0, room.y, 0); 
            mesh.userData = { ...room, id: `room-${room.id}`, isSelectable: true, category: 'IfcSpace', baseColorHex: mat.color.getHex() };
            
            group.add(mesh);
          }
        });
      }

    }
  }, [pluginOutputs, theme, visibility, mainViewMode, active2DView]); 

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
  
  if (mainViewMode === '2D' || mainViewMode === '3D') {
    return (
      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
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
  
  return null;
}