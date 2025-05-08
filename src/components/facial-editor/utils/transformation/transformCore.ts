
/**
 * Core transformation utilities for applying transformations to images
 * Enhanced with superior transition handling
 */

// Helper for calculating ultra-smooth transition zones with sigmoid-like curves
export const calculateTransitionFactor = (
  distFromCenter: number,
  innerEdge: number,
  maxInfluenceDistance: number
): number => {
  if (distFromCenter <= innerEdge) return 1.0;
  if (distFromCenter >= maxInfluenceDistance) return 0.0;
  
  // Calculate normalized position in transition zone
  const t = (distFromCenter - innerEdge) / (maxInfluenceDistance - innerEdge);
  
  // Use enhanced smoothstep function (quintic curve) for ultra-smooth transitions
  // This creates a much more gradual transition with no visible boundaries
  return 1.0 - (t*t*t * (t * (t * 6 - 15) + 10));
};

// Helper for bilinear interpolation with improved edge handling
export const bilinearInterpolation = (
  originalData: ImageData,
  x: number, 
  y: number, 
  width: number,
  height: number,
  outputData: ImageData,
  index: number
): void => {
  // Calculate safe coordinates with extra boundary padding
  // Ensure coordinates stay well within bounds with additional safety margin
  const safetyMargin = 2;
  const sampleX = Math.max(safetyMargin, Math.min(width - safetyMargin - 1, x));
  const sampleY = Math.max(safetyMargin, Math.min(height - safetyMargin - 1, y));
  
  const x1 = Math.floor(sampleX);
  const y1 = Math.floor(sampleY);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);
  
  const xWeight = sampleX - x1;
  const yWeight = sampleY - y1;
  
  // Pre-calculate offsets for performance
  const topLeftOffset = (y1 * width + x1) * 4;
  const topRightOffset = (y1 * width + x2) * 4;
  const bottomLeftOffset = (y2 * width + x1) * 4;
  const bottomRightOffset = (y2 * width + x2) * 4;
  
  // Use cubic interpolation for smoother results (enhanced from linear)
  for (let i = 0; i < 3; i++) {
    // Get corner values
    const topLeft = originalData.data[topLeftOffset + i];
    const topRight = originalData.data[topRightOffset + i];
    const bottomLeft = originalData.data[bottomLeftOffset + i];
    const bottomRight = originalData.data[bottomRightOffset + i];
    
    // Cubic interpolation for horizontal edges (improved from linear)
    const xWeight2 = xWeight * xWeight;
    const xWeight3 = xWeight2 * xWeight;
    
    // Improved cubic hermite interpolation
    const hx1 = 2*xWeight3 - 3*xWeight2 + 1;
    const hx2 = -2*xWeight3 + 3*xWeight2;
    
    const top = topLeft * hx1 + topRight * hx2;
    const bottom = bottomLeft * hx1 + bottomRight * hx2;
    
    // Similar cubic interpolation for vertical direction
    const yWeight2 = yWeight * yWeight;
    const yWeight3 = yWeight2 * yWeight;
    
    const hy1 = 2*yWeight3 - 3*yWeight2 + 1;
    const hy2 = -2*yWeight3 + 3*yWeight2;
    
    // Combine horizontal and vertical interpolations
    outputData.data[index + i] = Math.round(top * hy1 + bottom * hy2);
  }
  
  // Alpha channel stays the same
  outputData.data[index + 3] = originalData.data[topLeftOffset + 3];
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
