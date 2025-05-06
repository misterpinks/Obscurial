
/**
 * Handles pixel-level processing for image transformations
 */

import { calculateTransitionFactor, bilinearInterpolation, copyPixel } from './transformCore';
import { getFacialRegions } from '../facialRegions';

// Process a single row of pixels
export const processRow = (
  y: number,
  width: number,
  height: number,
  originalData: ImageData,
  outputData: ImageData,
  centerX: number,
  centerY: number,
  halfFaceWidth: number,
  halfFaceHeight: number,
  innerEdge: number,
  maxInfluenceDistance: number,
  clampedSliderValues: Record<string, number>,
  amplificationFactor: number,
  safetyMargin: number
): void => {
  const facialRegions = getFacialRegions();
  
  // Pre-calculate row offset for performance
  const rowOffset = y * width;
  
  for (let x = 0; x < width; x++) {
    // Calculate normalized position relative to face center
    const normX = (x - centerX) / halfFaceWidth;
    const normY = (y - centerY) / halfFaceHeight;
    const distFromCenter = Math.sqrt(normX * normX + normY * normY);
    
    // Skip if outside approximate face area (fast path)
    if (distFromCenter > maxInfluenceDistance) {
      // Just copy original pixel for areas outside the face
      const i = (rowOffset + x) * 4;
      copyPixel(originalData, outputData, i, i);
      continue;
    }
    
    // Calculate displacement based on facial feature regions
    let displacementX = 0;
    let displacementY = 0;
    
    // Process each facial region
    for (const region of facialRegions) {
      if (region.condition(normX, normY, distFromCenter)) {
        const displacement = region.transform(
          normX, normY, clampedSliderValues, amplificationFactor
        );
        displacementX += displacement.displacementX;
        displacementY += displacement.displacementY;
      }
    }
    
    // Apply additional transition zone for smoother blending at edges
    if (distFromCenter > innerEdge && distFromCenter < maxInfluenceDistance) {
      const smoothFadeFactor = calculateTransitionFactor(distFromCenter, innerEdge, maxInfluenceDistance);
      displacementX *= smoothFadeFactor;
      displacementY *= smoothFadeFactor;
    }
    
    // Calculate sample position with displacement
    const sampleX = x - displacementX;
    const sampleY = y - displacementY;
    
    // Pixel index calculation (optimized)
    const index = (rowOffset + x) * 4;
    
    // Handle edge cases and perform bilinear interpolation
    if (sampleX < safetyMargin || sampleY < safetyMargin || 
        sampleX >= width - safetyMargin || sampleY >= height - safetyMargin) {
      // For near-edge pixels, use clamped interpolation
      let adjustedSampleX = Math.max(safetyMargin, Math.min(width - safetyMargin - 1, sampleX));
      let adjustedSampleY = Math.max(safetyMargin, Math.min(height - safetyMargin - 1, sampleY));
      
      bilinearInterpolation(
        originalData, 
        adjustedSampleX, 
        adjustedSampleY, 
        width, 
        height, 
        outputData, 
        index
      );
    } else {
      // Use bilinear interpolation for interior pixels
      bilinearInterpolation(
        originalData, 
        sampleX, 
        sampleY, 
        width, 
        height, 
        outputData, 
        index
      );
    }
  }
};
