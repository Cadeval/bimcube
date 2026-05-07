import blueprint from './blueprint.json';

export function compute(inputs) {
    const { widthX, depthY, h00, h01, h02 } = inputs;
    
    const zLevels = [ 0, h00, h00 + h01, h00 + h01 + h02 ];
    
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

    const generatedSlabs = blueprint.slabs.map(slabDef => {
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

    const rawWalls = blueprint.walls.map((wallDef, index) => {
        const p1 = pointMap[wallDef.p1];
        const p2 = pointMap[wallDef.p2];
        const mat = blueprint.materialTypes[wallDef.mat];
        if (!p1 || !p2) return null;

        const storeyIdx = parseInt(wallDef.p1.split('-')[0].substring(1));
        
        const p1X = p1.x + (wallDef.offsetP1?.x || 0);
        const p1Z = p1.z + (wallDef.offsetP1?.z || 0); 
        const p2X = p2.x + (wallDef.offsetP2?.x || 0);
        const p2Z = p2.z + (wallDef.offsetP2?.z || 0);

        const currentFloorHeight = mat.fixedHeight !== undefined 
            ? mat.fixedHeight 
            : (zLevels[storeyIdx + 1] ? zLevels[storeyIdx + 1] - zLevels[storeyIdx] - 0.42 : 3.0 - 0.42); 

        const dx = p2X - p1X;
        const dz = p2Z - p1Z;
        const length = Math.sqrt((dx * dx) + (dz * dz)); 
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

    const generatedWalls = rawWalls.map(wall => {
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
        const newP2X = wall.p2X + (wall.dirX * p2Ext);
        const newP2Z = wall.p2Z + (wall.dirZ * p2Ext);
        
        const topLvl = wall.baseLevel + wall.currentFloorHeight + (wall.mat.zOffsetTop || 0);

        return { 
            id: wall.id, length: finalLen, height: topLvl - wall.baseLevel, thickness: wall.mat.thickness, 
            x: (newP1X + newP2X) / 2, y: wall.baseLevel + ((topLvl - wall.baseLevel) / 2), z: (newP1Z + newP2Z) / 2, 
            rotationY: -Math.atan2(wall.dz, wall.dx), dirX: wall.dirX, dirZ: wall.dirZ, 
            color: wall.mat.color, level: wall.level, typeId: wall.typeId, baseLevel: wall.baseLevel
        };
    });

    // 🪄 MULTI-STORY FACADE CORNER WRAPPING LOGIC
    const generatedFacades = (blueprint.facades || []).map((facadeDef, index) => {
        const p1 = pointMap[`Z0-${facadeDef.gridStart}`];
        const p2 = pointMap[`Z0-${facadeDef.gridEnd}`];
        const mat = blueprint.materialTypes[facadeDef.mat];
        if (!p1 || !p2) return null;

        const p1X = p1.x + (facadeDef.offsetX || 0);
        const p1Z = p1.z + (facadeDef.offsetZ || 0); 
        const p2X = p2.x + (facadeDef.offsetX || 0);
        const p2Z = p2.z + (facadeDef.offsetZ || 0);

        // Vector Direction of the Facade
        const rawDx = p2X - p1X;
        const rawDz = p2Z - p1Z;
        const rawLen = Math.hypot(rawDx, rawDz); 
        const dirX = rawDx / rawLen;
        const dirZ = rawDz / rawLen;

        // 🪄 EXTENSION FIX: Push the points outwards by the offset amount so the corners meet perfectly!
        const ext = Math.abs(facadeDef.offsetX || facadeDef.offsetZ || 0);
        
        const finalP1X = p1X - (dirX * ext);
        const finalP1Z = p1Z - (dirZ * ext);
        const finalP2X = p2X + (dirX * ext);
        const finalP2Z = p2Z + (dirZ * ext);

        const finalDx = finalP2X - finalP1X;
        const finalDz = finalP2Z - finalP1Z;
        const finalLength = Math.hypot(finalDx, finalDz);

        const baseLevel = 0;
        const topLevel = zLevels[3] + 0.8; 
        const height = topLevel - baseLevel;
        
        const midX = (finalP1X + finalP2X) / 2;
        const midZ = (finalP1Z + finalP2Z) / 2;
        const midY = height / 2;

        uniqueTypes.add(facadeDef.mat);
        typeColors[facadeDef.mat] = mat.color;

        return { 
            id: `CW-${index}`, length: finalLength, height, thickness: mat.thickness, 
            x: midX, y: midY, z: midZ, 
            rotationY: -Math.atan2(finalDz, finalDx), dirX, dirZ, 
            color: mat.color, opacity: mat.opacity || 1, level: 0, typeId: facadeDef.mat, baseLevel: 0
        };
    }).filter(Boolean);

    const generatedOpenings = blueprint.openings.map((openingDef, index) => {
        const p1 = pointMap[openingDef.gridStart];
        const p2 = pointMap[openingDef.gridEnd];
        const opType = blueprint.openingTypes[openingDef.type];
        if (!p1 || !p2 || !opType) return null;

        const storeyIdx = parseInt(openingDef.gridStart.split('-')[0].substring(1));
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;

        uniqueTypes.add(openingDef.type);
        typeColors[openingDef.type] = opType.color;

        const hostRawWall = rawWalls.find(w => {
            if (w.level !== storeyIdx) return false;
            const d1 = Math.hypot(midX - w.p1X, midZ - w.p1Z);
            const d2 = Math.hypot(midX - w.p2X, midZ - w.p2Z);
            return Math.abs((d1 + d2) - w.length) < 0.05; 
        });

        const hostWall = hostRawWall ? generatedWalls.find(w => w.id === hostRawWall.id) : null;

        let rotationY = 0, tangentX = 0, tangentZ = 0, thickness = 0.2, baseLevel = p1.y;

        if (hostWall) {
            rotationY = hostWall.rotationY; tangentX = hostWall.dirX; tangentZ = hostWall.dirZ;
            thickness = hostWall.thickness + 0.6; 
            baseLevel = hostWall.baseLevel;
        } else {
            const dx = p2.x - p1.x; const dz = p2.z - p1.z;
            const len = Math.hypot(dx, dz);
            tangentX = dx / len; tangentZ = dz / len;
            rotationY = -Math.atan2(dz, dx);
        }

        return {
            id: `O${index}`, width: opType.width, height: opType.height, depth: thickness, 
            x: midX, y: baseLevel + opType.sill + (opType.height / 2), z: midZ, 
            rotationY, dirX: tangentX, dirZ: tangentZ, 
            color: opType.color, opacity: opType.opacity, level: storeyIdx, typeId: openingDef.type, category: opType.category
        };
    }).filter(Boolean);

    return {
        description: `Constructable BIM with Solid Facade`,
        renderType: 'floorplan-grid', 
        dimensions: { widthX, depthY },
        meta: { levels: Array.from(uniqueLevels).sort(), types: Array.from(uniqueTypes).sort(), colors: typeColors },
        coordinates: points, slabs: generatedSlabs, 
        walls: [...generatedWalls, ...generatedFacades], 
        openings: generatedOpenings
    };
}