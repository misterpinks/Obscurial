
/**
 * Core transformation utilities for applying transformations to images
 */

// Helper for calculating transition zones and edge effects with improved smoothing
export const calculateTransitionFactor = (
  distFromCenter: number,
  innerEdge: number,
  maxInfluenceDistance: number
): number => {
  if (distFromCenter <= innerEdge) return 1.0;
  if (distFromCenter >= maxInfluenceDistance) return 0.0;
  
  // Enhanced smoothing - use cubic easing for more natural transition
  const t = (distFromCenter - innerEdge) / (maxInfluenceDistance - innerEdge);
  
  // Improved smoothstep function (cubic Hermite curve)
  return 1.0 - (t * t * (3 - 2 * t));
};

// Helper for bilinear interpolation - optimized
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
  
  // Pre-calculate offsets for performance
  const topLeftOffset = (y1 * width + x1) * 4;
  const topRightOffset = (y1 * width + x2) * 4;
  const bottomLeftOffset = (y2 * width + x1) * 4;
  const bottomRightOffset = (y2 * width + x2) * 4;
  
  // Unrolled loop for better performance
  // Red channel
  const topLeftR = originalData.data[topLeftOffset];
  const topRightR = originalData.data[topRightOffset];
  const bottomLeftR = originalData.data[bottomLeftOffset];
  const bottomRightR = originalData.data[bottomRightOffset];
  
  const topR = topLeftR + (topRightR - topLeftR) * xWeight;
  const bottomR = bottomLeftR + (bottomRightR - bottomLeftR) * xWeight;
  outputData.data[index] = topR + (bottomR - topR) * yWeight;
  
  // Green channel
  const topLeftG = originalData.data[topLeftOffset + 1];
  const topRightG = originalData.data[topRightOffset + 1];
  const bottomLeftG = originalData.data[bottomLeftOffset + 1];
  const bottomRightG = originalData.data[bottomRightOffset + 1];
  
  const topG = topLeftG + (topRightG - topLeftG) * xWeight;
  const bottomG = bottomLeftG + (bottomRightG - bottomLeftG) * xWeight;
  outputData.data[index + 1] = topG + (bottomG - topG) * yWeight;
  
  // Blue channel
  const topLeftB = originalData.data[topLeftOffset + 2];
  const topRightB = originalData.data[topRightOffset + 2];
  const bottomLeftB = originalData.data[bottomLeftOffset + 2];
  const bottomRightB = originalData.data[bottomRightOffset + 2];
  
  const topB = topLeftB + (topRightB - topLeftB) * xWeight;
  const bottomB = bottomLeftB + (bottomRightB - bottomLeftB) * xWeight;
  outputData.data[index + 2] = topB + (bottomB - topB) * yWeight;
  
  // Alpha channel
  outputData.data[index + 3] = originalData.data[topLeftOffset + 3];
};

// Helper to copy pixel directly from source to destination - optimized
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
