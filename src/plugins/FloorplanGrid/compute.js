export function compute(inputs) {
  const { widthX, depthY, z1, z2, z3 } = inputs;
  
  // X-Axis Math
  const Ex = widthX / 2;
  const B = Ex / 3;
  const uAxis = { 'A': 0, 'B': B, 'C': B + B, 'D': Ex - 2, 'E': Ex, 'F': Ex + 2, 'G': Ex + B, 'H': Ex + B + B, 'I': widthX };

  // Depth/Z-Axis Math
  const Ey = depthY / 2;
  const vAxis = { '0': 0, '1': Ey - 3, '2': Ey - 2.2, '3': Ey - 0.5, '4': Ey, '5': Ey + 0.5, '6': Ey + 2.2, '7': Ey + 3, '8': depthY };

  const storeys = [z1, z2, z3];
  const points = [];

  // Loop through storeys, then X, then Depth
  storeys.forEach(storeyHeight => {
      for (const [uName, xVal] of Object.entries(uAxis)) {
          for (const [vName, zVal] of Object.entries(vAxis)) {
              points.push({
                  name: `${uName}${vName}`, 
                  x: xVal,
                  y: storeyHeight, // Y is vertical height in Three.js
                  z: zVal          // Z is depth
              });
          }
      }
  });

  return {
      description: `Multi-storey grid`,
      renderType: 'floorplan-grid', // The magic word for our Viewport!
      dimensions: { widthX, depthY },
      coordinates: points
  };
}