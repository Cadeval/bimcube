import blueprint from './blueprint.json';

export function compute(inputs) {
    const { 
        widthX, depthY, storeyCount, hGround, hTypical, hParapet, 
        colorCW1, colorCW2, colorGlass, alignType, wPanelGround, wPanelV, wPanelH 
    } = inputs;
    
    const activeGlassColor = colorGlass || "#8ab4f8";
    const hWindow = Math.min(inputs.hWindow || 2.4, hTypical - 0.2);
    
    const zLevels = [0, hGround];
    let currentZ = hGround;
    for (let i = 0; i < storeyCount; i++) {
        currentZ += hTypical;
        zLevels.push(currentZ); 
    }
    const roofLevelIndex = storeyCount + 1;
    
    const halfX = widthX / 2;
    const E = halfX - 1.35;
    
    const uAxis = { 
        'A': 0, 'B': 3.72, 'C': E - 3.60, 'D': E - 1.58, 
        'E': E, 'F': E + 1.58, 'G': E + 3.60, 'H': widthX - 3.65, 'I': widthX 
    };

    const halfY = depthY / 2;
    const vAxis = { 
        '0': 0, '1': halfY - 4.25, '2': halfY - 2.77, '3': halfY - 1.30, 
        '4': halfY, '5': halfY + 0.76, '6': halfY + 2.77, '7': halfY + 4.25, '8': depthY 
    };

    const points = [];
    const pointMap = {}; 
    const uniqueLevels = new Set();
    const uniqueTypes = new Set(['Grid']); 
    const typeColors = { 'Grid': '#00d1b2' };

    zLevels.forEach((elevation, index) => {
        uniqueLevels.add(index);
        for (const [uName, xVal] of Object.entries(uAxis)) {
            for (const [vName, zVal] of Object.entries(vAxis)) {
                const id = `Z${index}-${uName}${vName}`; 
                const centeredX = xVal - (widthX / 2);
                const centeredZ = zVal - (depthY / 2);
                const pointData = { id, name: `${uName}${vName}`, x: centeredX, y: elevation, z: centeredZ, level: index, typeId: 'Grid' };
                points.push(pointData);
                pointMap[id] = pointData; 
            }
        }
    });

    const expandBlueprint = (arr) => {
        const expanded = [];
        (arr || []).forEach(item => {
            const ref = item.p1 || item.gridStart || item.level;
            if (!ref) { expanded.push(item); return; } 
            
            if (ref.startsWith('Z0-') || ref === 'Z0') {
                expanded.push(item);
            } else if (ref.startsWith('ZR-') || ref === 'ZR') {
                const newLvl = `Z${roofLevelIndex}`;
                expanded.push({
                    ...item,
                    level: item.level ? newLvl : undefined,
                    p1: item.p1 ? item.p1.replace('ZR-', `${newLvl}-`) : undefined,
                    p2: item.p2 ? item.p2.replace('ZR-', `${newLvl}-`) : undefined,
                    gridStart: item.gridStart ? item.gridStart.replace('ZR-', `${newLvl}-`) : undefined,
                    gridEnd: item.gridEnd ? item.gridEnd.replace('ZR-', `${newLvl}-`) : undefined
                });
            } else if (ref.startsWith('Z1-') || ref === 'Z1') {
                for (let lvl = 1; lvl <= storeyCount; lvl++) {
                    const newLvl = `Z${lvl}`;
                    expanded.push({
                        ...item,
                        id: item.id ? `${item.id}-L${lvl}` : undefined,
                        level: item.level ? newLvl : undefined,
                        p1: item.p1 ? item.p1.replace('Z1-', `${newLvl}-`) : undefined,
                        p2: item.p2 ? item.p2.replace('Z1-', `${newLvl}-`) : undefined,
                        gridStart: item.gridStart ? item.gridStart.replace('Z1-', `${newLvl}-`) : undefined,
                        gridEnd: item.gridEnd ? item.gridEnd.replace('Z1-', `${newLvl}-`) : undefined
                    });
                }
            }
        });
        return expanded;
    };

    const expandedSlabs = expandBlueprint(blueprint.slabs);
    const expandedWalls = expandBlueprint(blueprint.walls);
    const expandedOpenings = expandBlueprint(blueprint.openings);
    const expandedRooms = expandBlueprint(blueprint.rooms);

    const generatedSlabs = expandedSlabs.map(slabDef => {
        const p1 = pointMap[slabDef.p1];
        const p2 = pointMap[slabDef.p2];
        const mat = blueprint.materialTypes[slabDef.mat];
        if (!p1 || !p2) return null;

        const storeyIdx = parseInt(slabDef.p1.split('-')[0].substring(1));
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;
        const midY = p1.y - (mat.thickness / 2) + (mat.zOffsetTop || 0); 
        
        uniqueTypes.add(slabDef.mat);
        typeColors[slabDef.mat] = mat.color;

        return { width: Math.abs(p2.x - p1.x), depth: Math.abs(p2.z - p1.z), height: mat.thickness, x: midX, y: midY, z: midZ, color: mat.color, level: storeyIdx, typeId: slabDef.mat };
    }).filter(Boolean);

    const rawWalls = expandedWalls.map((wallDef, index) => {
        const p1 = pointMap[wallDef.p1];
        const p2 = pointMap[wallDef.p2];
        const mat = blueprint.materialTypes[wallDef.mat];
        if (!p1 || !p2) return null;

        const storeyIdx = parseInt(wallDef.p1.split('-')[0].substring(1));
        
        const p1X = p1.x + (wallDef.offsetP1?.x || 0);
        const p1Z = p1.z + (wallDef.offsetP1?.z || 0); 
        const p2X = p2.x + (wallDef.offsetP2?.x || 0);
        const p2Z = p2.z + (wallDef.offsetP2?.z || 0);

        let currentFloorHeight = zLevels[storeyIdx + 1] ? zLevels[storeyIdx + 1] - zLevels[storeyIdx] - 0.42 : hParapet; 
        if (mat.type === 'parapet') currentFloorHeight = hParapet;

        const dx = p2X - p1X;
        const dz = p2Z - p1Z;
        const length = Math.hypot(dx, dz); 
        const dirX = dx / length;
        const dirZ = dz / length;

        uniqueTypes.add(wallDef.mat);
        typeColors[wallDef.mat] = mat.color;

        return {
            id: `W${index}`, p1Id: wallDef.p1, p2Id: wallDef.p2, p1X, p1Z, p2X, p2Z, 
            dx, dz, dirX, dirZ, length, isHorizontal: Math.abs(dx) > Math.abs(dz), mat, currentFloorHeight,
            baseLevel: p1.y + (mat.zOffsetBottom || 0), level: storeyIdx, typeId: wallDef.mat
        };
    }).filter(Boolean);

    const nodeConnections = {}; 
    rawWalls.forEach(w => {
        if (!nodeConnections[w.p1Id]) nodeConnections[w.p1Id] = [];
        if (!nodeConnections[w.p2Id]) nodeConnections[w.p2Id] = [];
    });

    const isPointOnGridSegment = (nodeId, wall) => {
        const node = pointMap[nodeId];
        if (node.level !== wall.level) return false; 
        const wP1 = pointMap[wall.p1Id];
        const wP2 = pointMap[wall.p2Id];
        const d1 = Math.hypot(node.x - wP1.x, node.z - wP1.z);
        const d2 = Math.hypot(node.x - wP2.x, node.z - wP2.z);
        const lineLen = Math.hypot(wP2.x - wP1.x, wP2.z - wP1.z);
        return Math.abs((d1 + d2) - lineLen) < 0.001; 
    };

    Object.keys(nodeConnections).forEach(nodeId => {
        rawWalls.forEach(wall => {
            if (isPointOnGridSegment(nodeId, wall) && !nodeConnections[nodeId].some(w => w.id === wall.id)) {
                nodeConnections[nodeId].push(wall);
            }
        });
    });

    const winsCorner = (wallA, wallB) => {
        if (wallA.mat.priority < wallB.mat.priority) return true; 
        if (wallA.mat.priority > wallB.mat.priority) return false; 
        return wallA.isHorizontal; 
    };

    const generatedOpenings = expandedOpenings.map((openingDef, index) => {
        const p1 = pointMap[openingDef.gridStart];
        const p2 = pointMap[openingDef.gridEnd];
        
        const opType = { ...blueprint.openingTypes[openingDef.type] };
        
        if (openingDef.type.startsWith('OW')) {
            opType.height = hWindow; 
            opType.color = activeGlassColor; 
            opType.opacity = 0.65;
        }
        
        if (!p1 || !p2 || !opType) return null;

        const storeyIdx = parseInt(openingDef.gridStart.split('-')[0].substring(1));
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;

        const oDx = p2.x - p1.x;
        const oDz = p2.z - p1.z;
        const oLen = Math.hypot(oDx, oDz);
        const oDirX = oLen > 0.001 ? oDx / oLen : 0;
        const oDirZ = oLen > 0.001 ? oDz / oLen : 0;

        uniqueTypes.add(openingDef.type);
        typeColors[openingDef.type] = opType.color;

        const hostRawWall = rawWalls.find(w => {
            if (w.level !== storeyIdx) return false;
            const d1 = Math.hypot(midX - w.p1X, midZ - w.p1Z);
            const d2 = Math.hypot(midX - w.p2X, midZ - w.p2Z);
            if (Math.abs((d1 + d2) - w.length) > 0.5) return false; 
            if (oLen > 0.1) {
                const dot = Math.abs(oDirX * w.dirX + oDirZ * w.dirZ);
                if (dot < 0.5) return false;
            }
            return true;
        });

        const hostWall = hostRawWall ? hostRawWall : null; 
        let rotationY = 0, tangentX = 0, tangentZ = 0, thickness = 0.05, baseLevel = p1.y;

        if (hostWall) {
            rotationY = -Math.atan2(hostWall.dz, hostWall.dx); 
            tangentX = hostWall.dirX; 
            tangentZ = hostWall.dirZ;
            baseLevel = hostWall.baseLevel;
        } else {
            tangentX = oDirX; tangentZ = oDirZ;
            rotationY = -Math.atan2(oDz, oDx);
        }

        return {
            id: `O${index}`, hostWallId: hostWall ? hostWall.id : null, 
            width: opType.width, height: opType.height, depth: thickness, 
            x: midX, y: baseLevel + opType.sill + (opType.height / 2), z: midZ, 
            rotationY, dirX: tangentX, dirZ: tangentZ, 
            color: opType.color, opacity: opType.opacity, level: storeyIdx, typeId: openingDef.type, category: opType.category
        };
    }).filter(Boolean);

    const generatedWalls = [];
    
    rawWalls.forEach(wall => {
        let p1Ext = 0, p2Ext = 0;
        
        const p1Comp = nodeConnections[wall.p1Id].filter(w => w.id !== wall.id);
        if (p1Comp.length > 0) {
            let dom = p1Comp[0];
            for (let i = 1; i < p1Comp.length; i++) if (winsCorner(p1Comp[i], dom)) dom = p1Comp[i];
            p1Ext = winsCorner(wall, dom) ? (dom.mat.thickness / 2) : -(dom.mat.thickness / 2);
        }
        
        const p2Comp = nodeConnections[wall.p2Id].filter(w => w.id !== wall.id);
        if (p2Comp.length > 0) {
            let dom = p2Comp[0];
            for (let i = 1; i < p2Comp.length; i++) if (winsCorner(p2Comp[i], dom)) dom = p2Comp[i];
            p2Ext = winsCorner(wall, dom) ? (dom.mat.thickness / 2) : -(dom.mat.thickness / 2);
        }

        const finalLen = wall.length + p1Ext + p2Ext;
        const newP1X = wall.p1X - (wall.dirX * p1Ext);
        const newP1Z = wall.p1Z - (wall.dirZ * p1Ext);
        const topLvl = wall.baseLevel + wall.currentFloorHeight + (wall.mat.zOffsetTop || 0);

        const wallOpenings = generatedOpenings.filter(op => op.hostWallId === wall.id).map(op => {
            const opD1 = Math.hypot(op.x - wall.p1X, op.z - wall.p1Z);
            const wall1D = opD1 + p1Ext; 
            return {
                ...op,
                wall1D,
                start: Math.max(0, wall1D - (op.width / 2)),
                end: Math.min(finalLen, wall1D + (op.width / 2)) 
            };
        }).sort((a, b) => a.start - b.start);

        const generateSubWall = (subName, dStart, dEnd, yBase, h) => {
            const wLen = dEnd - dStart;
            if (wLen <= 0.01 || h <= 0.01) return; 
            
            const cx = newP1X + wall.dirX * (dStart + wLen / 2);
            const cz = newP1Z + wall.dirZ * (dStart + wLen / 2);
            
            generatedWalls.push({
                id: `${wall.id}-${subName}`, length: wLen, height: h, thickness: wall.mat.thickness,
                x: cx, y: yBase + (h / 2), z: cz,
                rotationY: -Math.atan2(wall.dz, wall.dx), dirX: wall.dirX, dirZ: wall.dirZ,
                color: wall.mat.color, level: wall.level, typeId: wall.typeId, baseLevel: wall.baseLevel
            });
        };

        if (wallOpenings.length === 0) {
            generateSubWall('Solid', 0, finalLen, wall.baseLevel, topLvl - wall.baseLevel);
            return;
        }

        let currentD = 0;
        wallOpenings.forEach((op, opIdx) => {
            if (op.start > currentD) generateSubWall(`Gap-${opIdx}`, currentD, op.start, wall.baseLevel, topLvl - wall.baseLevel);
            
            const sillHeight = op.y - (op.height / 2) - wall.baseLevel;
            if (sillHeight > 0) generateSubWall(`Sill-${opIdx}`, op.start, op.end, wall.baseLevel, sillHeight);

            const windowTop = op.y + (op.height / 2);
            const lintelHeight = topLvl - windowTop;
            if (lintelHeight > 0) generateSubWall(`Lintel-${opIdx}`, op.start, op.end, windowTop, lintelHeight);

            currentD = Math.max(currentD, op.end);
        });

        if (currentD < finalLen) generateSubWall(`EndGap`, currentD, finalLen, wall.baseLevel, topLvl - wall.baseLevel);
    });

    const generatedFacades = [];
    (blueprint.facades || []).forEach((facadeDef, fIndex) => {
        const p1 = pointMap[`Z0-${facadeDef.gridStart}`];
        const p2 = pointMap[`Z0-${facadeDef.gridEnd}`];
        const mat = blueprint.materialTypes[facadeDef.mat];
        if (!p1 || !p2) return;

        let baseColor = mat.color;
        if (facadeDef.mat === 'CW1') baseColor = colorCW1 || mat.color;
        if (facadeDef.mat === 'CW2') baseColor = colorCW2 || mat.color;

        const p1X = p1.x + (facadeDef.offsetX || 0);
        const p1Z = p1.z + (facadeDef.offsetZ || 0); 
        const p2X = p2.x + (facadeDef.offsetX || 0);
        const p2Z = p2.z + (facadeDef.offsetZ || 0);

        const rawDx = p2X - p1X;
        const rawDz = p2Z - p1Z;
        const rawLen = Math.hypot(rawDx, rawDz); 
        const dirX = rawDx / rawLen;
        const dirZ = rawDz / rawLen;

        const ext = Math.abs(facadeDef.offsetX || facadeDef.offsetZ || 0);
        const finalP1X = p1X - (dirX * ext);
        const finalP1Z = p1Z - (dirZ * ext);
        const finalP2X = p2X + (dirX * ext);
        const finalP2Z = p2Z + (dirZ * ext);

        const finalDx = finalP2X - finalP1X;
        const finalDz = finalP2Z - finalP1Z;
        const finalLength = Math.hypot(finalDx, finalDz);
        const rotationY = -Math.atan2(finalDz, finalDx);

        uniqueTypes.add(facadeDef.mat);
        typeColors[facadeDef.mat] = baseColor;
        
        const generatePanels = (bandName, segmentStart, segmentEnd, yStart, yEnd, panelW, colorOverride, opacity, lvl, gapOverride = 0.02, spawnStuds = false) => {
            const h = yEnd - yStart;
            if (h <= 0 || segmentEnd - segmentStart <= 0.01) return; 
            const midY = yStart + h / 2;
            
            const panelStep = panelW + gapOverride;
            const totalPanels = Math.floor(finalLength / panelStep);
            const remainder = finalLength - (totalPanels * panelStep); 
            
            let offset = 0;
            if (alignType === 'center') offset = remainder / 2;
            if (alignType === 'right') offset = remainder;

            const masterPanels = [];
            if (offset > 0) masterPanels.push({ start: 0, end: offset });
            
            let curr = offset > 0 ? offset + gapOverride : 0;
            while (curr < finalLength) {
               let next = Math.min(curr + panelW, finalLength);
               masterPanels.push({ start: curr, end: next });
               curr = next + gapOverride;
            }
            
            let pIndex = 0;
            masterPanels.forEach(p => {
                const iStart = Math.max(p.start, segmentStart);
                const iEnd = Math.min(p.end, segmentEnd);
                
                if (iEnd - iStart > 0.005) { 
                    const w = iEnd - iStart;
                    const cx = finalP1X + dirX * (iStart + w / 2);
                    const cz = finalP1Z + dirZ * (iStart + w / 2);
                    generatedFacades.push({
                        id: `CW-${fIndex}-${bandName}-${pIndex}-${Math.round(iStart*100)}`,
                        length: w, height: h, thickness: mat.thickness,
                        x: cx, y: midY, z: cz,
                        rotationY, dirX, dirZ, color: colorOverride || baseColor, opacity, level: lvl, typeId: facadeDef.mat, baseLevel: 0
                    });
                }

                if (spawnStuds && p.end < finalLength && p.end >= segmentStart && (p.end + gapOverride) <= segmentEnd) {
                    const studW = gapOverride; 
                    const studCx = finalP1X + dirX * (p.end + studW / 2);
                    const studCz = finalP1Z + dirZ * (p.end + studW / 2);
                    generatedFacades.push({
                        id: `CW-${fIndex}-GroundStud-${pIndex}`,
                        length: studW, height: h, thickness: 0.14, 
                        x: studCx, y: midY, z: studCz,
                        rotationY, dirX, dirZ, color: '#3a3a3a', opacity: 1, level: lvl, typeId: facadeDef.mat, baseLevel: 0
                    });
                }
                pIndex++;
            });
        };

        if (facadeDef.mat === 'CW2') {
            const topLevel = zLevels[roofLevelIndex] + hParapet;
            generatedFacades.push({ 
                id: `CW2-${fIndex}`, length: finalLength, height: topLevel, thickness: mat.thickness, 
                x: (finalP1X + finalP2X) / 2, y: topLevel / 2, z: (finalP1Z + finalP2Z) / 2, 
                rotationY, dirX, dirZ, color: baseColor, opacity: 1, level: 0, typeId: facadeDef.mat 
            });
            return;
        }

        if (facadeDef.mat === 'CW1') {
            const hSpandrel = hTypical - hWindow;
            const groundGlassHeight = hGround - hSpandrel;

            generatePanels('L0-Glass', 0, finalLength, 0, groundGlassHeight, wPanelGround || 1.6, activeGlassColor, 0.65, 0, 0.06, true);
            generatePanels('L0-Span', 0, finalLength, groundGlassHeight, zLevels[1], wPanelH, baseColor, 1, 0, 0.02, false);

            for (let lvl = 1; lvl <= storeyCount; lvl++) {
                const floorBase = zLevels[lvl];
                const windowTop = floorBase + hWindow; 
                const nextFloorBase = zLevels[lvl+1]; 

                const floorOpenings = generatedOpenings.filter(op => {
                    if (op.level !== lvl) return false;
                    const opD1 = Math.hypot(op.x - p1.x, op.z - p1.z);
                    const opD2 = Math.hypot(op.x - p2.x, op.z - p2.z);
                    if (Math.abs((opD1 + opD2) - rawLen) > 0.5) return false;
                    op.facadeD1 = opD1 + ext; 
                    return true;
                }).map(op => ({
                    start: Math.max(0, op.facadeD1 - (op.width / 2)),
                    end: Math.min(finalLength, op.facadeD1 + (op.width / 2))
                })).sort((a, b) => a.start - b.start);

                let currentD = 0;
                floorOpenings.forEach(op => {
                    if (op.start > currentD) generatePanels(`L${lvl}-Pilaster`, currentD, op.start, floorBase, windowTop, wPanelV, baseColor, 1, lvl);
                    currentD = Math.max(currentD, op.end);
                });
                
                if (currentD < finalLength) generatePanels(`L${lvl}-Pilaster`, currentD, finalLength, floorBase, windowTop, wPanelV, baseColor, 1, lvl);

                generatePanels(`L${lvl}-Span`, 0, finalLength, windowTop, nextFloorBase, wPanelH, baseColor, 1, lvl);
            }

            const roofBase = zLevels[roofLevelIndex];
            generatePanels('LR-Parapet', 0, finalLength, roofBase, roofBase + hParapet, wPanelH, baseColor, 1, roofLevelIndex);
        }
    });

    const generatedRooms = expandedRooms.map((roomDef) => {
        const storeyIdx = parseInt(roomDef.level.substring(1));
        const yBase = zLevels[storeyIdx];
        const height = (zLevels[storeyIdx + 1] ? zLevels[storeyIdx + 1] - yBase : hParapet) - 0.42; 
        
        const roomType = blueprint.roomTypes[roomDef.type] || { color: "#ffffff" };

        uniqueTypes.add(`Space: ${roomDef.type}`);
        typeColors[`Space: ${roomDef.type}`] = roomType.color;

        const polygon = [];
        let valid = true;

        roomDef.points.forEach(ptDef => {
            let ptStr = "";
            let ox = 0, oz = 0;

            if (typeof ptDef === 'string') {
                ptStr = `Z${storeyIdx}-${ptDef}`;
            } else {
                ptStr = `Z${storeyIdx}-${ptDef.grid}`;
                ox = ptDef.offsetX || 0;
                oz = ptDef.offsetZ || 0;
            }

            const gridNode = pointMap[ptStr];
            if (gridNode) {
                polygon.push({ x: gridNode.x + ox, z: gridNode.z + oz });
            } else {
                valid = false;
            }
        });

        if (!valid || polygon.length < 3) return null;

        let area = 0;
        for (let i = 0; i < polygon.length; i++) {
            const j = (i + 1) % polygon.length;
            area += polygon[i].x * polygon[j].z;
            area -= polygon[j].x * polygon[i].z;
        }
        area = Math.abs(area / 2);

        return {
            id: roomDef.id, name: roomDef.type, typeId: `Space: ${roomDef.type}`, level: storeyIdx,
            y: yBase, height: height, points: polygon, area: area, volume: area * height,
            color: roomType.color
        };
    }).filter(Boolean);

    return {
        description: `Parametric ${storeyCount + 2}-Storey Highrise Engine`,
        renderType: 'floorplan-grid', 
        dimensions: { widthX, depthY },
        meta: { levels: Array.from(uniqueLevels).sort(), types: Array.from(uniqueTypes).sort(), colors: typeColors },
        coordinates: points, slabs: generatedSlabs, 
        walls: [...generatedWalls, ...generatedFacades], 
        openings: generatedOpenings,
        rooms: generatedRooms 
    };
}