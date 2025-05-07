
/**
 * Web Worker for offloading image processing tasks
 * This runs in a separate thread to prevent UI blocking
 */

// Type definitions for Web Worker context
declare const self: DedicatedWorkerGlobalScope;

// Let main thread know worker is ready
self.postMessage({ status: 'ready' });

// Handle messages from main thread
self.onmessage = (event) => {
  const { command, originalImageData, params } = event.data;
  
  if (command === 'process') {
    processImageData(originalImageData, params);
  }
};

// Process image data in the worker thread
const processImageData = (
  originalImageData: { 
    data: ArrayBufferLike; 
    width: number; 
    height: number; 
  }, 
  params: {
    centerX: number;
    centerY: number;
    halfFaceWidth: number;
    halfFaceHeight: number;
    innerEdge: number;
    maxInfluenceDistance: number;
    sliderValues: Record<string, number>;
    amplificationFactor: number;
    safetyMargin: number;
  }
) => {
  const startTime = performance.now();
  
  try {
    // Create data views for original and output data
    const originalData = new Uint8ClampedArray(originalImageData.data);
    const outputData = new Uint8ClampedArray(originalData.length);
    
    // Extract parameters
    const { width, height } = originalImageData;
    const { 
      centerX, 
      centerY, 
      halfFaceWidth, 
      halfFaceHeight,
      innerEdge,
      maxInfluenceDistance,
      sliderValues,
      amplificationFactor,
      safetyMargin
    } = params;
    
    // Process all rows
    for (let y = 0; y < height; y++) {
      processRow(
        y,
        width,
        height,
        originalData,
        outputData,
        centerX,
        centerY,
        halfFaceWidth,
        halfFaceHeight,
        innerEdge,
        maxInfluenceDistance,
        sliderValues,
        amplificationFactor,
        safetyMargin
      );
    }
    
    const processingTime = performance.now() - startTime;
    
    // Transfer processed data back to main thread
    // Fix: Correct usage of postMessage with transferable objects
    const messageData = {
      processedData: outputData.buffer,
      width: originalImageData.width,
      height: originalImageData.height,
      processingTime
    };
    
    // Correctly specify transferables as an array of Transferable objects
    self.postMessage(messageData, [outputData.buffer as Transferable]);
  } catch (error) {
    // Report errors back to main thread
    self.postMessage({
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Process a single row of pixels (copypasta from pixelProcessor.ts for worker isolation)
const processRow = (
  y: number,
  width: number,
  height: number,
  originalData: Uint8ClampedArray,
  outputData: Uint8ClampedArray,
  centerX: number,
  centerY: number,
  halfFaceWidth: number,
  halfFaceHeight: number,
  innerEdge: number,
  maxInfluenceDistance: number,
  sliderValues: Record<string, number>,
  amplificationFactor: number,
  safetyMargin: number
): void => {
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
          normX, normY, sliderValues, amplificationFactor
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

// Helper functions from transformCore.ts (duplicated for worker isolation)

// Helper for calculating transition zones and edge effects
const calculateTransitionFactor = (
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

// Helper for bilinear interpolation - optimized
const bilinearInterpolation = (
  originalData: Uint8ClampedArray,
  x: number, 
  y: number, 
  width: number,
  height: number,
  outputData: Uint8ClampedArray,
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
  const topLeftR = originalData[topLeftOffset];
  const topRightR = originalData[topRightOffset];
  const bottomLeftR = originalData[bottomLeftOffset];
  const bottomRightR = originalData[bottomRightOffset];
  
  const topR = topLeftR + (topRightR - topLeftR) * xWeight;
  const bottomR = bottomLeftR + (bottomRightR - bottomLeftR) * xWeight;
  outputData[index] = topR + (bottomR - topR) * yWeight;
  
  // Green channel
  const topLeftG = originalData[topLeftOffset + 1];
  const topRightG = originalData[topRightOffset + 1];
  const bottomLeftG = originalData[bottomLeftOffset + 1];
  const bottomRightG = originalData[bottomRightOffset + 1];
  
  const topG = topLeftG + (topRightG - topLeftG) * xWeight;
  const bottomG = bottomLeftG + (bottomRightG - bottomLeftG) * xWeight;
  outputData[index + 1] = topG + (bottomG - topG) * yWeight;
  
  // Blue channel
  const topLeftB = originalData[topLeftOffset + 2];
  const topRightB = originalData[topRightOffset + 2];
  const bottomLeftB = originalData[bottomLeftOffset + 2];
  const bottomRightB = originalData[bottomRightOffset + 2];
  
  const topB = topLeftB + (topRightB - topLeftB) * xWeight;
  const bottomB = bottomLeftB + (bottomRightB - bottomLeftB) * xWeight;
  outputData[index + 2] = topB + (bottomB - topB) * yWeight;
  
  // Alpha channel
  outputData[index + 3] = originalData[topLeftOffset + 3];
};

// Helper to copy pixel directly from source to destination - optimized
const copyPixel = (
  originalData: Uint8ClampedArray,
  outputData: Uint8ClampedArray,
  sourceIndex: number,
  destIndex: number
): void => {
  outputData[destIndex] = originalData[sourceIndex];
  outputData[destIndex + 1] = originalData[sourceIndex + 1];
  outputData[destIndex + 2] = originalData[sourceIndex + 2];
  outputData[destIndex + 3] = originalData[sourceIndex + 3];
};

// Simplified facial region types for worker isolation
interface FacialRegion {
  condition: (normX: number, normY: number, distFromCenter?: number) => boolean;
  transform: (normX: number, normY: number, sliderValues: Record<string, number>, amplificationFactor: number) => {
    displacementX: number;
    displacementY: number;
  };
}

// Simplified facial regions implementation for worker isolation
const facialRegions: FacialRegion[] = [
  // Entire face region (global effect)
  {
    condition: (normX, normY, distFromCenter = 0) => distFromCenter <= 1.0,
    transform: (normX, normY, sliderValues, amplificationFactor) => {
      const widthFactor = (sliderValues.faceWidth || 0) * amplificationFactor * 0.01;
      const heightFactor = (sliderValues.faceHeight || 0) * amplificationFactor * 0.01;
      
      return {
        displacementX: normX * widthFactor,
        displacementY: normY * heightFactor
      };
    }
  },
  
  // Eyes region
  {
    condition: (normX, normY) => {
      const eyeY = -0.2;
      const eyeDistanceY = Math.abs(normY - eyeY);
      return eyeDistanceY < 0.2 && Math.abs(normX) < 0.5;
    },
    transform: (normX, normY, sliderValues, amplificationFactor) => {
      const eyesWidthFactor = (sliderValues.eyesWidth || 0) * amplificationFactor * 0.01;
      const eyesHeightFactor = (sliderValues.eyesHeight || 0) * amplificationFactor * 0.01;
      
      // Only apply horizontal displacement in eye region
      return {
        displacementX: normX * eyesWidthFactor,
        displacementY: normY * eyesHeightFactor
      };
    }
  },
  
  // Jaw region
  {
    condition: (normX, normY) => {
      return normY > 0.2 && Math.abs(normX) < 0.8;
    },
    transform: (normX, normY, sliderValues, amplificationFactor) => {
      const jawWidthFactor = (sliderValues.jawWidth || 0) * amplificationFactor * 0.01;
      
      // Only apply horizontal displacement in jaw region
      return {
        displacementX: normX * jawWidthFactor, 
        displacementY: 0
      };
    }
  }
];
