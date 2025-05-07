
/**
 * Web Worker for image processing operations
 * This runs in a separate thread to prevent UI blocking
 */

import { WorkerGlobalScopeInterface } from './workerManager';

// Declare `self` with the proper interface type
// This avoids the DedicatedWorkerGlobalScope error
const workerSelf: WorkerGlobalScopeInterface = self as unknown as WorkerGlobalScopeInterface;

// Send a ready message back to the main thread
console.log("Worker initialized");
workerSelf.postMessage({ status: 'ready' });

// Process messages from main thread
workerSelf.addEventListener('message', (event: MessageEvent) => {
  const { command, originalImageData, params } = event.data;
  
  if (command === 'process') {
    processImageData(originalImageData, params);
  }
});

/**
 * Process image data with facial transformations
 */
function processImageData(originalImageData: any, params: any) {
  try {
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
    
    // Create output array for the processed image
    const outputData = new Uint8ClampedArray(originalImageData.data.length);
    
    // Start time for performance measurement
    const startTime = performance.now();
    
    // Process the entire image data
    for (let y = 0; y < height; y++) {
      processRow(
        y,
        width,
        height,
        originalImageData.data,
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
    
    // Calculate processing time
    const processingTime = performance.now() - startTime;
    
    // Send processed data back to main thread
    workerSelf.postMessage(
      {
        processedData: outputData.buffer,
        width,
        height,
        processingTime
      }, 
      [outputData.buffer]
    );
  } catch (error: any) {
    // Report errors back to main thread
    workerSelf.postMessage({
      error: error.message || 'Unknown error in worker'
    });
  }
}

/**
 * Process a single row of pixels for facial transformations
 */
function processRow(
  y: number,
  width: number,
  height: number,
  inputData: Uint8ClampedArray,
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
) {
  for (let x = 0; x < width; x++) {
    // Calculate normalized position relative to face center
    const normX = (x - centerX) / halfFaceWidth;
    const normY = (y - centerY) / halfFaceHeight;
    const distFromCenter = Math.sqrt(normX * normX + normY * normY);
    
    // Get the current pixel index
    const index = (y * width + x) * 4;
    
    // Skip if outside approximate face area
    if (distFromCenter > maxInfluenceDistance) {
      // Just copy original pixel for areas outside the face
      outputData[index] = inputData[index];
      outputData[index + 1] = inputData[index + 1];
      outputData[index + 2] = inputData[index + 2];
      outputData[index + 3] = inputData[index + 3];
      continue;
    }
    
    // Calculate transition factor - smooth falloff at edges
    const transitionFactor = calculateTransitionFactor(distFromCenter, innerEdge, maxInfluenceDistance);
    
    // Calculate displacement based on facial feature sliders
    let displacementX = 0;
    let displacementY = 0;
    
    // Eye region transformations
    if (Math.abs(normY + 0.25) < 0.2 && Math.abs(normX) < 0.4) {
      displacementX += (sliderValues.eyeSize || 0) / 100 * normX * amplificationFactor * transitionFactor;
      displacementY += (sliderValues.eyeSize || 0) / 100 * normY * amplificationFactor * transitionFactor;
      displacementX += (sliderValues.eyeSpacing || 0) / 100 * (normX > 0 ? 1 : -1) * amplificationFactor * transitionFactor;
    }
    
    // More facial feature transformations would be added here...
    
    // Apply the calculated displacement
    const sampleX = Math.max(safetyMargin, Math.min(width - safetyMargin - 1, x - displacementX));
    const sampleY = Math.max(safetyMargin, Math.min(height - safetyMargin - 1, y - displacementY));
    
    // Use bilinear interpolation for smoother results
    bilinearInterpolation(
      sampleX, 
      sampleY, 
      width, 
      height, 
      inputData, 
      outputData, 
      index
    );
  }
}

/**
 * Calculate smooth transition factor for transformation boundary
 */
function calculateTransitionFactor(distFromCenter: number, innerEdge: number, maxDistance: number): number {
  if (distFromCenter <= innerEdge) {
    return 1.0;
  }
  if (distFromCenter >= maxDistance) {
    return 0.0;
  }
  return 1.0 - (distFromCenter - innerEdge) / (maxDistance - innerEdge);
}

/**
 * Apply bilinear interpolation for smoother pixel sampling
 */
function bilinearInterpolation(
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  inputData: Uint8ClampedArray, 
  outputData: Uint8ClampedArray, 
  targetIndex: number
) {
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);
  
  const xWeight = x - x1;
  const yWeight = y - y1;
  
  const topLeft = (y1 * width + x1) * 4;
  const topRight = (y1 * width + x2) * 4;
  const bottomLeft = (y2 * width + x1) * 4;
  const bottomRight = (y2 * width + x2) * 4;
  
  // Interpolate for each color channel
  for (let c = 0; c < 3; c++) {
    const top = inputData[topLeft + c] * (1 - xWeight) + inputData[topRight + c] * xWeight;
    const bottom = inputData[bottomLeft + c] * (1 - xWeight) + inputData[bottomRight + c] * xWeight;
    outputData[targetIndex + c] = top * (1 - yWeight) + bottom * yWeight;
  }
  
  // Alpha channel stays the same
  outputData[targetIndex + 3] = inputData[topLeft + 3];
}

// Export these functions if needed elsewhere
export { processRow, calculateTransitionFactor, bilinearInterpolation };
