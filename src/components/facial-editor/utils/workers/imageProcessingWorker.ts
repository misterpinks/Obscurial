
/**
 * Web Worker for image processing tasks
 * This runs in a separate thread to prevent UI freezing
 */

// Import types by copying them directly since Web Workers can't import modules
interface ProcessCommandData {
  command: 'process';
  originalImageData: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  };
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
  };
}

type WorkerMessage = ProcessCommandData;

// Helper functions that need to be available inside the worker
// Calculate transition factor for smooth blending
const calculateTransitionFactor = (
  distFromCenter: number,
  innerEdge: number,
  maxInfluenceDistance: number
): number => {
  if (distFromCenter <= innerEdge) return 1.0;
  if (distFromCenter >= maxInfluenceDistance) return 0.0;
  
  const transitionZone = maxInfluenceDistance - innerEdge;
  const fadeFactor = 1.0 - ((distFromCenter - innerEdge) / transitionZone);
  
  return fadeFactor * fadeFactor;
};

// Bilinear interpolation implementation for the worker
const bilinearInterpolation = (
  originalData: Uint8ClampedArray,
  width: number,
  height: number,
  x: number, 
  y: number,
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

// Copy pixel directly from source to destination
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

// Process a single row of pixels
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
    
    // Eye region transformations
    if (Math.abs(normY + 0.35) < 0.25 && Math.abs(normX) < 0.45) {
      displacementX += (sliderValues.eyeSize || 0) / 50 * normX * amplificationFactor;
      displacementY += (sliderValues.eyeSize || 0) / 50 * normY * amplificationFactor;
      displacementX += (sliderValues.eyeSpacing || 0) / 50 * (normX > 0 ? 1 : -1) * amplificationFactor;
    }
    
    // Eyebrow region transformations
    if (normY < -0.25 && normY > -0.75 && Math.abs(normX) > 0.05 && Math.abs(normX) < 0.5) {
      displacementY -= (sliderValues.eyebrowHeight || 0) / 50 * amplificationFactor;
    }
    
    // Nose region transformations
    if (Math.abs(normX) < 0.25 && normY > -0.4 && normY < 0.25) {
      displacementX += (sliderValues.noseWidth || 0) / 50 * normX * amplificationFactor;
      displacementY += (sliderValues.noseLength || 0) / 50 * (normY > 0 ? 1 : -1) * amplificationFactor;
    }
    
    // Mouth region transformations
    if (Math.abs(normX) < 0.35 && normY > 0.05 && normY < 0.45) {
      displacementX += (sliderValues.mouthWidth || 0) / 50 * normX * amplificationFactor;
      displacementY += (sliderValues.mouthHeight || 0) / 50 * (normY - 0.25) * amplificationFactor;
    }
    
    // Face width transformation
    if (distFromCenter > 0.4 && distFromCenter < 1.1) {
      displacementX += (sliderValues.faceWidth || 0) / 50 * normX * amplificationFactor;
    }
    
    // Chin shape transformations
    if (normY > 0.35 && Math.abs(normX) < 0.35) {
      displacementY += (sliderValues.chinShape || 0) / 50 * (normY - 0.4) * amplificationFactor;
    }
    
    // Jawline transformations
    if (normY > 0.15 && Math.abs(normX) > 0.25 && Math.abs(normX) < 0.65) {
      displacementX += (sliderValues.jawline || 0) / 50 * (normX > 0 ? 1 : -1) * amplificationFactor;
    }
    
    // Apply transition zone for smoother blending
    if (distFromCenter > innerEdge && distFromCenter < maxInfluenceDistance) {
      const smoothFadeFactor = calculateTransitionFactor(distFromCenter, innerEdge, maxInfluenceDistance);
      displacementX *= smoothFadeFactor;
      displacementY *= smoothFadeFactor;
    }
    
    // Calculate sample position with displacement
    const sampleX = x - displacementX;
    const sampleY = y - displacementY;
    
    // Pixel index calculation
    const index = (rowOffset + x) * 4;
    
    // Handle edge cases and perform bilinear interpolation
    if (sampleX < safetyMargin || sampleY < safetyMargin || 
        sampleX >= width - safetyMargin || sampleY >= height - safetyMargin) {
      // For near-edge pixels, use clamped interpolation
      let adjustedSampleX = Math.max(safetyMargin, Math.min(width - safetyMargin - 1, sampleX));
      let adjustedSampleY = Math.max(safetyMargin, Math.min(height - safetyMargin - 1, sampleY));
      
      bilinearInterpolation(
        originalData,
        width, 
        height,
        adjustedSampleX, 
        adjustedSampleY,
        outputData, 
        index
      );
    } else {
      // Use bilinear interpolation for interior pixels
      bilinearInterpolation(
        originalData,
        width, 
        height,
        sampleX, 
        sampleY, 
        outputData, 
        index
      );
    }
  }
};

// Process chunks of rows for better responsiveness even within the worker
const processImageChunks = (
  originalData: Uint8ClampedArray,
  width: number,
  height: number,
  params: ProcessCommandData['params']
): Uint8ClampedArray => {
  // Create output buffer with same dimensions as input
  const outputData = new Uint8ClampedArray(originalData.length);
  
  // Extract parameters
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
  
  // Process all rows (in a worker we can do this all at once)
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
  
  return outputData;
};

// Web Worker message handler
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  try {
    const { command, originalImageData, params } = event.data;
    
    if (command === 'process') {
      // Start timer to measure performance
      const startTime = performance.now();
      
      // Extract image data
      const { data, width, height } = originalImageData;
      
      // Process the image
      const processedData = processImageChunks(
        data,
        width,
        height,
        params
      );
      
      // Calculate processing time
      const processingTime = performance.now() - startTime;
      
      // Send processed data back to main thread
      self.postMessage({
        processedData,
        width,
        height,
        processingTime
      }, [processedData.buffer]); // Transfer buffer ownership for better performance
    }
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      error: error instanceof Error ? error.message : 'Unknown error in worker'
    });
  }
};

// Let the main thread know the worker is ready
self.postMessage({ status: 'ready' });

// TypeScript needs this to recognize it as a module
export {};
