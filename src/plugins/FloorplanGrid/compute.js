// 1. MATERIAL LIBRARY (With Priority for Auto-Joining)
// Priority 1 is the highest (Wins corners & T-Intersections)
const materialTypes = {
    'WE01': { priority: 1, thickness: 0.45, color: '#d32f2f', type: 'exterior', zOffsetBottom: 0, zOffsetTop: 0 }, 
    'WE02': { priority: 2, thickness: 0.40, color: '#f57c00', type: 'exterior', zOffsetBottom: 0, zOffsetTop: 0 }, 
    'WI01': { priority: 3, thickness: 0.42, color: '#795548', type: 'interior', zOffsetBottom: 0, zOffsetTop: 0 }, 
    'WI02': { priority: 4, thickness: 0.40, color: '#9e9e9e', type: 'interior', zOffsetBottom: 0, zOffsetTop: 0 }, 
    'WI03': { priority: 5, thickness: 0.12, color: '#00acc1', type: 'interior', zOffsetBottom: 0, zOffsetTop: 0 }, 
    
    'SL01': { thickness: 0.30, color: '#8d6e63', type: 'slab', zOffsetBottom: 0, zOffsetTop: 0 },    
    'SL02': { thickness: 0.25, color: '#bdbdbd', type: 'slab', zOffsetBottom: 0, zOffsetTop: 0.001 } 
};

// 2. THE BLUEPRINT (Your exact layout)
const layoutBlueprint = {
    slabs: [
        { p1: 'Z0-A0', p2: 'Z0-I8', mat: 'SL01' },
        { p1: 'Z0-C3', p2: 'Z0-G5', mat: 'SL02' }
    ],
    walls: [
        // --- WE01 (Timber450) - red ---
        { p1: 'Z0-A0', p2: 'Z0-A8', mat: 'WE01' },
        { p1: 'Z0-I8', p2: 'Z0-I0', mat: 'WE01' },

        // --- WE02 (Timber400) - orange ---
        { p1: 'Z0-A8', p2: 'Z0-I8', mat: 'WE02' }, 
        { p1: 'Z0-I0', p2: 'Z0-A0', mat: 'WE02' },

        // --- WI01 (Timber420) - brown ---
        { p1: 'Z0-A4', p2: 'Z0-C4', mat: 'WI01' },
        { p1: 'Z0-G4', p2: 'Z0-I4', mat: 'WI01' },
        { p1: 'Z0-E0', p2: 'Z0-E1', mat: 'WI01' },
        { p1: 'Z0-E7', p2: 'Z0-E8', mat: 'WI01' },

        // --- WI02 (ConcreteCore400) - grey ---
        { p1: 'Z0-D1', p2: 'Z0-D3', mat: 'WI02' },
        { p1: 'Z0-D3', p2: 'Z0-C3', mat: 'WI02' },
        { p1: 'Z0-C3', p2: 'Z0-C5', mat: 'WI02' },
        { p1: 'Z0-C5', p2: 'Z0-C7', mat: 'WI02' },
        { p1: 'Z0-C7', p2: 'Z0-F7', mat: 'WI02' },
        { p1: 'Z0-F7', p2: 'Z0-F5', mat: 'WI02' },
        { p1: 'Z0-F5', p2: 'Z0-G5', mat: 'WI02' },
        { p1: 'Z0-G5', p2: 'Z0-G3', mat: 'WI02' },
        { p1: 'Z0-G3', p2: 'Z0-F3', mat: 'WI02' },
        { p1: 'Z0-F3', p2: 'Z0-F1', mat: 'WI02' },
        { p1: 'Z0-F1', p2: 'Z0-D1', mat: 'WI02' },

        // --- WI03 (Drywall 120) - green/blueish ---
        { p1: 'Z0-C0', p2: 'Z0-C2', mat: 'WI03' },
        { p1: 'Z0-C2', p2: 'Z0-D2', mat: 'WI03' },
        { p1: 'Z0-C8', p2: 'Z0-C6', mat: 'WI03' },
        { p1: 'Z0-C6', p2: 'Z0-D6', mat: 'WI03' },
        { p1: 'Z0-F1', p2: 'Z0-G1', mat: 'WI03' },
        { p1: 'Z0-G0', p2: 'Z0-G3', mat: 'WI03' },
        { p1: 'Z0-G5', p2: 'Z0-G8', mat: 'WI03' },
        { p1: 'Z0-F7', p2: 'Z0-G7', mat: 'WI03' },
        { p1: 'Z0-H0', p2: 'Z0-H4', mat: 'WI03' },
        { p1: 'Z0-H4', p2: 'Z0-H8', mat: 'WI03' },
        
        // Retaining your manual offsets
        { p1: 'Z0-H1', p2: 'Z0-H4', mat: 'WI03', offsetP1: { x: -1 }, offsetP2: { x: -1 } },
        { p1: 'Z0-H4', p2: 'Z0-H7', mat: 'WI03', offsetP1: { x: -1 }, offsetP2: { x: -1 } }
    ]
};

export function compute(inputs) {
    const { widthX, depthY, z1, z2, z3 } = inputs;
    
    // --- 1. GRID GENERATION ---
    const Ex = widthX / 2;
    const B = Ex / 3;
    const uAxis = { 'A': 0, 'B': B, 'C': B + B, 'D': Ex - 2, 'E': Ex, 'F': Ex + 2, 'G': Ex + B, 'H': Ex + B + B, 'I': widthX };

    const Ey = depthY / 2;
    const vAxis = { '0': 0, '1': Ey - 3, '2': Ey - 2.2, '3': Ey - 0.5, '4': Ey, '5': Ey + 0.5, '6': Ey + 2.2, '7': Ey + 3, '8': depthY };

    const storeys = [z1, z2, z3];
    const points = [];
    const pointMap = {}; 

    storeys.forEach((storeyHeight, index) => {
        for (const [uName, xVal] of Object.entries(uAxis)) {
            for (const [vName, zVal] of Object.entries(vAxis)) {
                const id = `Z${index}-${uName}${vName}`; 
                const centeredX = xVal - (widthX / 2);
                const centeredZ = zVal - (depthY / 2);
                const pointData = { id, name: `${uName}${vName}`, x: centeredX, y: storeyHeight, z: centeredZ };
                points.push(pointData);
                pointMap[id] = pointData; 
            }
        }
    });

    const groundFloorHeight = z2 - z1;

    // --- 2. SLAB GENERATION ---
    const generatedSlabs = layoutBlueprint.slabs.map(slabDef => {
        const p1 = pointMap[slabDef.p1];
        const p2 = pointMap[slabDef.p2];
        const mat = materialTypes[slabDef.mat];
        if (!p1 || !p2) return null;

        const width = Math.abs(p2.x - p1.x);
        const depth = Math.abs(p2.z - p1.z);
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;
        const midY = p1.y - (mat.thickness / 2) + (mat.zOffsetTop || 0); 

        return { width, depth, height: mat.thickness, x: midX, y: midY, z: midZ, color: mat.color };
    }).filter(Boolean);


    // --- 3. 🪄 THE GENIUS AUTO-JOIN WALL ALGORITHM (V2) 🪄 ---

    // Step A: Pre-calculate raw physical geometry for every wall
    const rawWalls = layoutBlueprint.walls.map((wallDef, index) => {
        const p1 = pointMap[wallDef.p1];
        const p2 = pointMap[wallDef.p2];
        const mat = materialTypes[wallDef.mat];
        if (!p1 || !p2) return null;

        const p1X = p1.x + (wallDef.offsetP1?.x || 0);
        const p1Z = p1.z + (wallDef.offsetP1?.z || 0);
        const p2X = p2.x + (wallDef.offsetP2?.x || 0);
        const p2Z = p2.z + (wallDef.offsetP2?.z || 0);

        const dx = p2X - p1X;
        const dz = p2Z - p1Z;
        const length = Math.sqrt((dx * dx) + (dz * dz)); 
        const isHorizontal = Math.abs(dx) > Math.abs(dz);

        return {
            id: `W${index}`, p1Id: wallDef.p1, p2Id: wallDef.p2,
            p1X, p1Z, p2X, p2Z, dx, dz, length, isHorizontal, mat,
            baseLevel: p1.y + (mat.zOffsetBottom || 0)
        };
    }).filter(Boolean);

    // Step B: Build the Topological Node Map (The T-Intersection Fix)
    const nodeConnections = {}; 
    
    // Initialize the map with every explicit endpoint
    rawWalls.forEach(wall => {
        if (!nodeConnections[wall.p1Id]) nodeConnections[wall.p1Id] = [];
        if (!nodeConnections[wall.p2Id]) nodeConnections[wall.p2Id] = [];
    });

    // Helper: Does a specific grid node mathematically lie on the wall's grid line segment?
    const isPointOnGridSegment = (nodeId, wall) => {
        const node = pointMap[nodeId];
        const wP1 = pointMap[wall.p1Id];
        const wP2 = pointMap[wall.p2Id];
        
        // Pythagorean distance formula
        const d1 = Math.hypot(node.x - wP1.x, node.z - wP1.z);
        const d2 = Math.hypot(node.x - wP2.x, node.z - wP2.z);
        const lineLen = Math.hypot(wP2.x - wP1.x, wP2.z - wP1.z);
        
        // If the distance to the node from both ends equals the total length, the node is ON the line!
        return Math.abs((d1 + d2) - lineLen) < 0.001; 
    };

    // Populate connections: Which walls pass through or touch this node?
    Object.keys(nodeConnections).forEach(nodeId => {
        rawWalls.forEach(wall => {
            if (isPointOnGridSegment(nodeId, wall)) {
                // Ensure no duplicates
                if (!nodeConnections[nodeId].some(w => w.id === wall.id)) {
                    nodeConnections[nodeId].push(wall);
                }
            }
        });
    });

    // Step C: Resolve the Intersections!
    const winsCorner = (wallA, wallB) => {
        if (wallA.mat.priority < wallB.mat.priority) return true; // Lower number wins!
        if (wallA.mat.priority > wallB.mat.priority) return false; 
        return wallA.isHorizontal; // Tie breaker
    };

    const generatedWalls = rawWalls.map(wall => {
        let p1Extension = 0;
        let p2Extension = 0;

        // Check Start Node (P1)
        const p1Competitors = nodeConnections[wall.p1Id].filter(w => w.id !== wall.id);
        if (p1Competitors.length > 0) {
            let dominantWall = p1Competitors[0];
            for (let i = 1; i < p1Competitors.length; i++) {
                if (winsCorner(p1Competitors[i], dominantWall)) dominantWall = p1Competitors[i];
            }
            // If we win, we push outward. If we lose, we shrink inward.
            p1Extension = winsCorner(wall, dominantWall) ? (dominantWall.mat.thickness / 2) : -(dominantWall.mat.thickness / 2);
        }

        // Check End Node (P2)
        const p2Competitors = nodeConnections[wall.p2Id].filter(w => w.id !== wall.id);
        if (p2Competitors.length > 0) {
            let dominantWall = p2Competitors[0];
            for (let i = 1; i < p2Competitors.length; i++) {
                if (winsCorner(p2Competitors[i], dominantWall)) dominantWall = p2Competitors[i];
            }
            p2Extension = winsCorner(wall, dominantWall) ? (dominantWall.mat.thickness / 2) : -(dominantWall.mat.thickness / 2);
        }

        // Apply mathematical extensions to physical endpoints
        const finalLength = wall.length + p1Extension + p2Extension;
        
        const dirX = wall.dx / wall.length;
        const dirZ = wall.dz / wall.length;
        const newP1X = wall.p1X - (dirX * p1Extension);
        const newP1Z = wall.p1Z - (dirZ * p1Extension);
        const newP2X = wall.p2X + (dirX * p2Extension);
        const newP2Z = wall.p2Z + (dirZ * p2Extension);
        
        const midX = (newP1X + newP2X) / 2;
        const midZ = (newP1Z + newP2Z) / 2;

        const topLevel = wall.baseLevel + groundFloorHeight + (wall.mat.zOffsetTop || 0);
        const midY = wall.baseLevel + ((topLevel - wall.baseLevel) / 2);
        const rotationY = -Math.atan2(wall.dz, wall.dx);

        return { 
            length: finalLength, height: topLevel - wall.baseLevel, thickness: wall.mat.thickness, 
            x: midX, y: midY, z: midZ, rotationY, color: wall.mat.color 
        };
    });

    return {
        description: `Auto-Joined Parametric Layout`,
        renderType: 'floorplan-grid', 
        dimensions: { widthX, depthY },
        coordinates: points,
        slabs: generatedSlabs,
        walls: generatedWalls
    };
}