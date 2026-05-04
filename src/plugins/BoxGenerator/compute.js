export function compute(inputs) {
  const { width, height, depth } = inputs;
  const points = [];

  for (let x = 0; x <= width; x++) {
    for (let y = 0; y <= height; y++) {
      for (let z = 0; z <= depth; z++) {
        if (x === 0 || x === width || y === 0 || y === height || z === 0 || z === depth) {
          points.push({ x, y, z }); 
        }
      }
    }
  }

  return {
    description: `Generated a hollow ${width}x${height}x${depth} 3D Box`,
    totalPoints: points.length,
    coordinates: points
  };
}