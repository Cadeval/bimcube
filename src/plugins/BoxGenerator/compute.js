export function compute(inputs) {
  const { width, height, depth, color } = inputs;
  
  return {
    description: `Solid ${width}x${height}x${depth} 3D Box`,
    renderType: 'box', // Tell the Viewport what shape to draw!
    dimensions: { width, height, depth },
    color: color || '#4af626'
  };
}