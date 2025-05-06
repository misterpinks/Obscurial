
/**
 * Core transformation utilities for applying transformations to images
 */

// Helper for calculating transition zones and edge effects
export const calculateTransitionFactor = (
  distFromCenter: number,
  innerEdge: number,
  maxInfluenceDistance: number
): number => {
  if (distFromCenter <= innerEdge) return 1.0;
  if (distFromCenter >= maxInfluenceDistance) return 0.0;
  
  // Calculate fade factor (1.0 at inner edge, 0.0 at outer edge)
  const transitionZone = maxInfluenceDistance - innerEdge;
  const fadeFactor = 1.0 - ((distFromCenter - innerEdge) / transitionZone);
  
  // Apply smoother quadratic easing
  return fadeFactor * fadeFactor;
};

// Helper for bilinear interpolation
export const bilinearInterpolation = (
  originalData: ImageData,
  x: number, 
  y: number, 
  width: number,
  height: number,
  outputData: ImageData,
  index: number
): void => {
  // Ensure coordinates are within bounds
  const sampleX = Math.max(0, Math.min(width - 1.001, x));
  const sampleY = Math.max(0, Math.min(height - 1.001, y));
  
  const x1 = Math.floor(sampleX);
  const y1 = Math.floor(sampleY);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);
  
  const xWeight = sampleX - x1;
  const yWeight = sampleY - y1;
  
  // Bilinear interpolation for each color channel
  for (let c = 0; c < 3; c++) {
    const topLeft = originalData.data[(y1 * width + x1) * 4 + c];
    const topRight = originalData.data[(y1 * width + x2) * 4 + c];
    const bottomLeft = originalData.data[(y2 * width + x1) * 4 + c];
    const bottomRight = originalData.data[(y2 * width + x2) * 4 + c];
    
    const top = topLeft + (topRight - topLeft) * xWeight;
    const bottom = bottomLeft + (bottomRight - bottomLeft) * xWeight;
    const interpolated = top + (bottom - top) * yWeight;
    
    // Directly set value (faster and safer)
    outputData.data[index + c] = interpolated;
  }
  
  // Alpha channel
  outputData.data[index + 3] = originalData.data[(y1 * width + x1) * 4 + 3];
};

// Helper to copy pixel directly from source to destination
export const copyPixel = (
  originalData: ImageData,
  outputData: ImageData,
  sourceIndex: number,
  destIndex: number
): void => {
  outputData.data[destIndex] = originalData.data[sourceIndex];
  outputData.data[destIndex + 1] = originalData.data[sourceIndex + 1];
  outputData.data[destIndex + 2] = originalData.data[sourceIndex + 2];
  outputData.data[destIndex + 3] = originalData.data[sourceIndex + 3];
};
