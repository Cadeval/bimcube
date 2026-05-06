// 🪄 1. DECOUPLED DATA: Import the blueprint!
import blueprint from './blueprint.json';

export function compute(inputs) {
    const { widthX, depthY, h00, h01, h02 } = inputs;
    
    const zLevels = [ 0, h00, h00 + h01, h00 + h01 + h02 ];
    const Ex = widthX / 2;
    const B = Ex / 3;
    const uAxis = { 'A': 0, 'B': B, 'C': B + B, 'D': Ex - 2, 'E': Ex, 'F': Ex + 2, 'G': Ex + B, 'H': Ex + B + B, 'I': widthX };
    const Ey = depthY / 2;
    const vAxis = { '0': 0, '1': Ey - 3, '2': Ey - 2.2, '3': Ey - 0.5, '4': Ey, '5': Ey + 0.5, '6': Ey + 2.2, '7': Ey + 3, '8': depthY };

    const points = [];
    const pointMap = {}; 

    // Generate Grid
    zLevels.forEach((elevation, index) => {
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

    // Generate Slabs
    const generatedSlabs = blueprint.slabs.map(slabDef => {
        const p1 = pointMap[slabDef.p1];
        const p2 = pointMap[slabDef.p2];
        const mat = blueprint.materialTypes[slabDef.mat];
        if (!p1 || !p2) return null;

        const storeyIdx = parseInt(slabDef.p1.split('-')[0].substring(1));
        const width = Math.abs(p2.x - p1.x);
        const depth = Math.abs(p2.z - p1.z);
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;
        const midY = p1.y - (mat.thickness / 2) + (mat.zOffsetTop || 0); 
        return { width, depth, height: mat.thickness, x: midX, y: midY, z: midZ, color: mat.color, level: storeyIdx, typeId: slabDef.mat };
    }).filter(Boolean);

    // Generate Raw Walls
    const rawWalls = blueprint.walls.map((wallDef, index) => {
        const p1 = pointMap[wallDef.p1];
        const p2 = pointMap[wallDef.p2];
        const mat = blueprint.materialTypes[wallDef.mat];
        if (!p1 || !p2) return null;

        const storeyIdx = parseInt(wallDef.p1.split('-')[0].substring(1));
        const currentFloorHeight = zLevels[storeyIdx + 1] - zLevels[storeyIdx];
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const length = Math.sqrt((dx * dx) + (dz * dz)); 
        const isHorizontal = Math.abs(dx) > Math.abs(dz);

        return {
            id: `W${index}`, p1Id: wallDef.p1, p2Id: wallDef.p2, p1X: p1.x, p1Z: p1.z, p2X: p2.x, p2Z: p2.z, 
            dx, dz, length, isHorizontal, mat, currentFloorHeight,
            baseLevel: p1.y + (mat.zOffsetBottom || 0), level: storeyIdx, typeId: wallDef.mat
        };
    }).filter(Boolean);

    // Auto-Join Math
    const nodeConnections = {}; 
    rawWalls.forEach(w => {
        if (!nodeConnections[w.p1Id]) nodeConnections[w.p1Id] = [];
        if (!nodeConnections[w.p2Id]) nodeConnections[w.p2Id] = [];
    });

    const isPointOnGridSegment = (nodeId, wall) => {
        const node = pointMap[nodeId];
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
        const dirX = wall.dx / wall.length, dirZ = wall.dz / wall.length;
        const newP1X = wall.p1X - (dirX * p1Ext), newP1Z = wall.p1Z - (dirZ * p1Ext);
        const newP2X = wall.p2X + (dirX * p2Ext), newP2Z = wall.p2Z + (dirZ * p2Ext);
        const topLvl = wall.baseLevel + wall.currentFloorHeight + (wall.mat.zOffsetTop || 0);

        return { 
            id: wall.id, length: finalLen, height: topLvl - wall.baseLevel, thickness: wall.mat.thickness, 
            x: (newP1X + newP2X) / 2, y: wall.baseLevel + ((topLvl - wall.baseLevel) / 2), z: (newP1Z + newP2Z) / 2, 
            rotationY: -Math.atan2(wall.dz, wall.dx), color: wall.mat.color, level: wall.level, typeId: wall.typeId,
            baseLevel: wall.baseLevel
        };
    });

    // 🪄 THE GENIUS GRID-ANCHORED HOST ALGORITHM 🪄
    const generatedOpenings = blueprint.openings.map((openingDef, index) => {
        const p1 = pointMap[openingDef.gridStart];
        const p2 = pointMap[openingDef.gridEnd];
        const opType = blueprint.openingTypes[openingDef.type];
        if (!p1 || !p2 || !opType) return null;

        const storeyIdx = parseInt(openingDef.gridStart.split('-')[0].substring(1));
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;

        // Find which wall hosts this grid point!
        let hostWall = generatedWalls.find(w => w.level === storeyIdx && 
            Math.abs(Math.hypot(midX - w.x, midZ - w.z) + Math.hypot(midX - w.x, midZ - w.z) - w.length) > -1 // Simplified intersection for prototype
        );
        
        // We calculate distance from the generated wall to ensure it inherits rotation
        let rotationY = 0;
        let thickness = 0.2; // Default if standing alone
        let baseLevel = p1.y;

        if (hostWall) {
            rotationY = hostWall.rotationY;
            thickness = hostWall.thickness + 0.02; // Protrude 10mm on each side so it renders perfectly over the wall!
            baseLevel = hostWall.baseLevel;
        } else {
            // Fallback math to guess rotation if no wall is found
            rotationY = -Math.atan2(p2.z - p1.z, p2.x - p1.x);
        }

        const midY = baseLevel + opType.sill + (opType.height / 2);

        return {
            id: `O${index}`, width: opType.width, height: opType.height, depth: thickness, 
            x: midX, y: midY, z: midZ, rotationY, color: opType.color, opacity: opType.opacity,
            level: storeyIdx, typeId: openingDef.type, category: opType.category
        };
    }).filter(Boolean);

    return {
        description: `Decoupled JSON Layout`,
        renderType: 'floorplan-grid', 
        dimensions: { widthX, depthY },
        coordinates: points,
        slabs: generatedSlabs,
        walls: generatedWalls,
        openings: generatedOpenings // Export the new windows/doors!
    };
}