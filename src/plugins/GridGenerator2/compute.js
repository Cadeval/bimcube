// This is a pure function. It takes our slider inputs and generates grid coordinates.
export function compute(inputs) {
  const { xWidth, yWidth } = inputs;
  const points = [];

  // Generate a simple 2D grid of coordinates
  for (let x = 0; x < xWidth; x++) {
    for (let y = 0; y < yWidth; y++) {
      points.push({ x, y, z: 0 }); // z is 0 because it's a flat grid for now
    }
  }

  // Return the calculated data payload
  return {
    description: `Generated a ${xWidth}x${yWidth} grid`,
    totalPoints: points.length,
    coordinates: points
  };
}