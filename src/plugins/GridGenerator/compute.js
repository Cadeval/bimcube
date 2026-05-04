export function compute(inputs) {
  const { xWidth, yWidth } = inputs;
  const points = [];

  for (let x = 0; x < xWidth; x++) {
    for (let y = 0; y < yWidth; y++) {
      points.push({ x, y, z: 0 }); 
    }
  }

  return {
    description: `Generated a ${xWidth}x${yWidth} grid`,
    totalPoints: points.length,
    coordinates: points
  };
}